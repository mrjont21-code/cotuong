/* network.js - Giao tiếp mạng (WebSocket + Mock mode cho demo) */

var Network = (function() {

    // === CONFIG ===
    // Đổi thành URL backend thật khi deploy: 'wss://your-backend.com/ws'
    var WEBSOCKET_URL = ''; // Để trống = dùng mock mode (local demo)

    var ws = null;
    var handlers = {};
    var mode = 'mock'; // 'websocket' hoặc 'mock'

    // === Mock backend (local demo) ===
    // Sử dụng localStorage + storage event để giả lập 2 client trên cùng máy
    var MockServer = (function() {
        var STORAGE_KEY = 'xiangqi_mock_server';
        var MSG_KEY = 'xiangqi_mock_msg';

        function getState() {
            try {
                var s = localStorage.getItem(STORAGE_KEY);
                return s ? JSON.parse(s) : { users: {}, invitations: {}, games: {} };
            } catch(e) {
                return { users: {}, invitations: {}, games: {} };
            }
        }

        function setState(s) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
            } catch(e) {}
        }

        function sendMsg(toGuestId, msg) {
            try {
                var data = {
                    to: toGuestId,
                    msg: msg,
                    _ts: Date.now() + Math.random()
                };
                localStorage.setItem(MSG_KEY, JSON.stringify(data));
                // Xóa sau một chút để có thể gửi lại cùng nội dung
                setTimeout(function() {
                    try { localStorage.removeItem(MSG_KEY); } catch(e) {}
                }, 100);
            } catch(e) {}
        }

        function broadcastOnline() {
            var s = getState();
            var users = [];
            for (var id in s.users) {
                if (s.users.hasOwnProperty(id)) {
                    users.push({ guest_id: id, nickname: s.users[id].nickname });
                }
            }
            var msg = { type: 'online_users', users: users };
            for (var uid in s.users) {
                if (s.users.hasOwnProperty(uid)) {
                    sendMsg(uid, msg);
                }
            }
        }

        function handleJoin(guest) {
            var s = getState();
            s.users[guest.guest_id] = { nickname: guest.nickname, _ts: Date.now() };
            setState(s);
            // Gửi xác nhận
            sendMsg(guest.guest_id, { type: 'join_accepted', guest: guest });
            broadcastOnline();
        }

        function handleLeave(guest_id) {
            var s = getState();
            delete s.users[guest_id];
            // Hủy invitations liên quan
            for (var iid in s.invitations) {
                if (s.invitations.hasOwnProperty(iid)) {
                    var inv = s.invitations[iid];
                    if (inv.from === guest_id || inv.to === guest_id) {
                        delete s.invitations[iid];
                        sendMsg(inv.from, { type: 'invitation_cancelled', invitation_id: iid });
                        sendMsg(inv.to, { type: 'invitation_cancelled', invitation_id: iid });
                    }
                }
            }
            // Kết thúc game liên quan
            for (var gid in s.games) {
                if (s.games.hasOwnProperty(gid)) {
                    var g = s.games[gid];
                    if (g.red === guest_id || g.black === guest_id) {
                        g.status = 'ABANDONED';
                        var other = (g.red === guest_id) ? g.black : g.red;
                        sendMsg(other, { type: 'opponent_disconnected', game_id: gid });
                    }
                }
            }
            setState(s);
            broadcastOnline();
        }

        function handleInvite(fromId, toId) {
            var s = getState();
            if (!s.users[toId]) return;
            // Kiểm tra người nhận không đang chơi
            for (var gid in s.games) {
                if (s.games.hasOwnProperty(gid)) {
                    var g = s.games[gid];
                    if (g.status === 'PLAYING' && (g.red === toId || g.black === toId)) {
                        sendMsg(fromId, { type: 'invite_rejected', reason: 'opponent_busy' });
                        return;
                    }
                }
            }
            var invId = 'inv_' + Math.random().toString(36).substr(2, 8);
            var inv = {
                invitation_id: invId,
                from: fromId,
                to: toId,
                from_nickname: s.users[fromId] ? s.users[fromId].nickname : '?',
                status: 'PENDING'
            };
            s.invitations[invId] = inv;
            setState(s);
            sendMsg(toId, {
                type: 'invitation_received',
                invitation_id: invId,
                from: fromId,
                from_nickname: inv.from_nickname
            });
        }

        function handleInviteAccept(invId, accepterId) {
            var s = getState();
            var inv = s.invitations[invId];
            if (!inv || inv.to !== accepterId) return;

            inv.status = 'ACCEPTED';
            var gameId = 'room_' + Math.random().toString(36).substr(2, 6);
            var game = {
                game_id: gameId,
                red: inv.from,
                black: inv.to,
                red_nickname: s.users[inv.from] ? s.users[inv.from].nickname : '?',
                black_nickname: s.users[accepterId] ? s.users[accepterId].nickname : '?',
                turn: 'red',
                board: Board.createInitial(),
                moves: [],
                status: 'PLAYING'
            };
            s.games[gameId] = game;
            delete s.invitations[invId];
            setState(s);

            var startMsg = {
                type: 'game_start',
                game_id: gameId,
                red: { guest_id: game.red, nickname: game.red_nickname },
                black: { guest_id: game.black, nickname: game.black_nickname },
                turn: 'red'
            };
            sendMsg(game.red, startMsg);
            sendMsg(game.black, startMsg);
        }

        function handleInviteDecline(invId, declinerId) {
            var s = getState();
            var inv = s.invitations[invId];
            if (!inv || inv.to !== declinerId) return;
            inv.status = 'DECLINED';
            delete s.invitations[invId];
            setState(s);
            sendMsg(inv.from, { type: 'invitation_declined', invitation_id: invId });
        }

        function handleCancelInvite(invId, senderId) {
            var s = getState();
            var inv = s.invitations[invId];
            if (!inv || inv.from !== senderId) return;
            delete s.invitations[invId];
            setState(s);
            sendMsg(inv.to, { type: 'invitation_cancelled', invitation_id: invId });
        }

        function handleMove(gameId, playerId, from, to) {
            var s = getState();
            var g = s.games[gameId];
            if (!g || g.status !== 'PLAYING') return;

            // Kiểm tra lượt
            if ((g.turn === 'red' && g.red !== playerId) ||
                (g.turn === 'black' && g.black !== playerId)) {
                sendMsg(playerId, { type: 'move_rejected', game_id: gameId, reason: 'not_your_turn' });
                return;
            }

            var fromSq = Notation.fromSquare(from);
            var toSq = Notation.fromSquare(to);

            // Kiểm tra luật
            if (!Rules.isValidMove(g.board, fromSq.col, fromSq.row, toSq.col, toSq.row)) {
                sendMsg(playerId, { type: 'move_rejected', game_id: gameId, reason: 'illegal_move' });
                return;
            }

            // Thực hiện nước đi
            var result = Rules.makeMove(g.board, fromSq.col, fromSq.row, toSq.col, toSq.row);
            g.board = result.board;
            g.moves.push({ from: from, to: to, player: playerId });
            g.turn = (g.turn === 'red') ? 'black' : 'red';

            setState(s);

            // Broadcast nước đi
            var moveMsg = {
                type: 'move',
                game_id: gameId,
                from: from,
                to: to,
                turn: g.turn
            };
            sendMsg(g.red, moveMsg);
            sendMsg(g.black, moveMsg);

            // Kiểm tra kết thúc ván
            var nextColor = g.turn;
            if (Rules.isCheckmate(g.board, nextColor)) {
                g.status = (nextColor === 'red') ? 'BLACK_WIN' : 'RED_WIN';
                setState(s);
                var endMsg = {
                    type: 'game_end',
                    game_id: gameId,
                    result: g.status.toLowerCase()
                };
                sendMsg(g.red, endMsg);
                sendMsg(g.black, endMsg);
            } else if (Rules.isStalemate(g.board, nextColor)) {
                g.status = 'DRAW';
                setState(s);
                sendMsg(g.red, { type: 'game_end', game_id: gameId, result: 'draw' });
                sendMsg(g.black, { type: 'game_end', game_id: gameId, result: 'draw' });
            }
        }

        function handleLeaveGame(gameId, playerId) {
            var s = getState();
            var g = s.games[gameId];
            if (!g) return;
            var other = (g.red === playerId) ? g.black : g.red;
            if (g.status === 'PLAYING') {
                g.status = (g.red === playerId) ? 'BLACK_WIN' : 'RED_WIN';
                sendMsg(other, {
                    type: 'game_end',
                    game_id: gameId,
                    result: g.status.toLowerCase()
                });
            }
            setState(s);
        }

        function handleStorageEvent(e) {
            if (e.key !== MSG_KEY || !e.newValue) return;
            try {
                var data = JSON.parse(e.newValue);
                if (data.to === AppState.get().guest.guest_id) {
                    dispatch(data.msg);
                }
            } catch(err) {}
        }

        function init() {
            window.addEventListener('storage', handleStorageEvent);
        }

        function send(data) {
            switch(data.type) {
                case 'join':
                    handleJoin(data.guest);
                    break;
                case 'leave':
                    handleLeave(data.guest_id);
                    break;
                case 'invite':
                    handleInvite(data.from, data.to);
                    break;
                case 'invite_accept':
                    handleInviteAccept(data.invitation_id, data.guest_id);
                    break;
                case 'invite_decline':
                    handleInviteDecline(data.invitation_id, data.guest_id);
                    break;
                case 'cancel_invite':
                    handleCancelInvite(data.invitation_id, data.guest_id);
                    break;
                case 'move':
                    handleMove(data.game_id, data.guest_id, data.from, data.to);
                    break;
                case 'leave_game':
                    handleLeaveGame(data.game_id, data.guest_id);
                    break;
            }
        }

        function cleanup() {
            // Dọn dẹp người dùng cũ (hết hạn)
            var s = getState();
            var now = Date.now();
            var changed = false;
            for (var id in s.users) {
                if (s.users.hasOwnProperty(id)) {
                    if (now - s.users[id]._ts > 60000) { // 60 giây
                        delete s.users[id];
                        changed = true;
                    }
                }
            }
            if (changed) {
                setState(s);
                broadcastOnline();
            }
        }

        return {
            init: init,
            send: send,
            cleanup: cleanup
        };
    })();

    // === Public API ===

    function on(event, callback) {
        if (!handlers[event]) handlers[event] = [];
        handlers[event].push(callback);
    }

    function off(event, callback) {
        if (!handlers[event]) return;
        handlers[event] = handlers[event].filter(function(cb) { return cb !== callback; });
    }

    function dispatch(msg) {
        var list = handlers[msg.type];
        if (list) {
            list.forEach(function(cb) {
                try { cb(msg); } catch(e) { console.error(e); }
            });
        }
        // Gọi handler chung
        if (handlers['*']) {
            handlers['*'].forEach(function(cb) {
                try { cb(msg); } catch(e) { console.error(e); }
            });
        }
    }

    function connect(guest) {
        if (WEBSOCKET_URL && WEBSOCKET_URL.indexOf('ws') === 0) {
            mode = 'websocket';
            connectWebSocket(guest);
        } else {
            mode = 'mock';
            MockServer.init();
            // Mô phỏng độ trễ mạng nhỏ
            setTimeout(function() {
                MockServer.send({ type: 'join', guest: guest });
                AppState.setConnected(true);
                dispatch({ type: 'connected' });
            }, 100);
        }
    }

    function connectWebSocket(guest) {
        try {
            ws = new WebSocket(WEBSOCKET_URL);
            ws.onopen = function() {
                AppState.setConnected(true);
                dispatch({ type: 'connected' });
                ws.send(JSON.stringify({ type: 'join', guest: guest }));
            };
            ws.onmessage = function(e) {
                try {
                    var msg = JSON.parse(e.data);
                    dispatch(msg);
                } catch(err) { console.error(err); }
            };
            ws.onclose = function() {
                AppState.setConnected(false);
                dispatch({ type: 'disconnected' });
            };
            ws.onerror = function(err) {
                console.error('WebSocket error:', err);
            };
        } catch(e) {
            console.error('WebSocket connect failed:', e);
        }
    }

    function send(data) {
        if (mode === 'websocket' && ws && ws.readyState === 1) {
            // Thêm guest_id vào các tin nhắn
            var payload = {};
            for (var k in data) { if (data.hasOwnProperty(k)) payload[k] = data[k]; }
            payload.guest_id = AppState.get().guest.guest_id;
            ws.send(JSON.stringify(payload));
        } else if (mode === 'mock') {
            var mockData = {};
            for (var mk in data) { if (data.hasOwnProperty(mk)) mockData[mk] = data[mk]; }
            mockData.guest_id = AppState.get().guest.guest_id;
            MockServer.send(mockData);
        }
    }

    function disconnect() {
        if (mode === 'websocket' && ws) {
            ws.close();
            ws = null;
        }
        AppState.setConnected(false);
    }

    function getMode() {
        return mode;
    }

    return {
        on: on,
        off: off,
        connect: connect,
        disconnect: disconnect,
        send: send,
        getMode: getMode,
        WEBSOCKET_URL: WEBSOCKET_URL
    };

})();
