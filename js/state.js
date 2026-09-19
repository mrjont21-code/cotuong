/* state.js - Trạng thái toàn cục của ứng dụng */

var AppState = (function() {

    var state = {
        // UI state: UI_1_NICKNAME, UI_2_LOBBY, UI_3_GAME
        ui: 'UI_1_NICKNAME',

        // Guest identity
        guest: {
            guest_id: null,
            nickname: null
        },

        // Lobby
        onlineUsers: [],

        // Invitation
        pendingInvitation: null,   // invitation nhận được
        sentInvitation: null,      // invitation đã gửi

        // Game
        game: {
            game_id: null,
            myColor: null,      // 'red' hoặc 'black'
            red: null,          // { guest_id, nickname }
            black: null,        // { guest_id, nickname }
            turn: 'red',
            board: null,
            status: null,       // WAITING, PLAYING, RED_WIN, BLACK_WIN, DRAW, ABANDONED
            selectedPiece: null,  // { col, row }
            legalMoves: []
        },

        // Network
        network: {
            connected: false,
            mode: 'mock'  // 'mock' hoặc 'websocket'
        }
    };

    function get() {
        return state;
    }

    function setUI(ui) {
        state.ui = ui;
    }

    function setGuest(guest_id, nickname) {
        state.guest.guest_id = guest_id;
        state.guest.nickname = nickname;
        try {
            localStorage.setItem('xiangqi_guest', JSON.stringify(state.guest));
        } catch(e) {}
    }

    function loadGuest() {
        try {
            var saved = localStorage.getItem('xiangqi_guest');
            if (saved) {
                var g = JSON.parse(saved);
                state.guest.guest_id = g.guest_id;
                state.guest.nickname = g.nickname;
                return true;
            }
        } catch(e) {}
        return false;
    }

    function clearGuest() {
        state.guest.guest_id = null;
        state.guest.nickname = null;
        try {
            localStorage.removeItem('xiangqi_guest');
        } catch(e) {}
    }

    function setOnlineUsers(users) {
        state.onlineUsers = users || [];
    }

    function setPendingInvitation(inv) {
        state.pendingInvitation = inv;
    }

    function setSentInvitation(inv) {
        state.sentInvitation = inv;
    }

    function resetGame() {
        state.game = {
            game_id: null,
            myColor: null,
            red: null,
            black: null,
            turn: 'red',
            board: null,
            status: null,
            selectedPiece: null,
            legalMoves: []
        };
    }

    function setGame(data) {
        state.game.game_id = data.game_id;
        state.game.red = data.red;
        state.game.black = data.black;
        state.game.turn = data.turn || 'red';
        state.game.status = data.status || 'PLAYING';
        state.game.board = data.board ? Board.clone(data.board) : Board.createInitial();
        state.game.selectedPiece = null;
        state.game.legalMoves = [];

        // Xác định màu của tôi
        if (state.game.red && state.game.red.guest_id === state.guest.guest_id) {
            state.game.myColor = 'red';
        } else if (state.game.black && state.game.black.guest_id === state.guest.guest_id) {
            state.game.myColor = 'black';
        }
    }

    function updateBoard(board, turn) {
        state.game.board = board;
        if (turn !== undefined) state.game.turn = turn;
        state.game.selectedPiece = null;
        state.game.legalMoves = [];
    }

    function setSelectedPiece(col, row) {
        state.game.selectedPiece = col !== null ? { col: col, row: row } : null;
        if (col !== null) {
            var piece = Board.getPiece(state.game.board, col, row);
            if (piece && piece.color === state.game.myColor) {
                state.game.legalMoves = Rules.getLegalMoves(state.game.board, col, row);
            } else {
                state.game.legalMoves = [];
            }
        } else {
            state.game.legalMoves = [];
        }
    }

    function setGameStatus(status) {
        state.game.status = status;
    }

    function setConnected(connected) {
        state.network.connected = connected;
    }

    function isMyTurn() {
        return state.game.turn === state.game.myColor;
    }

    return {
        get: get,
        setUI: setUI,
        setGuest: setGuest,
        loadGuest: loadGuest,
        clearGuest: clearGuest,
        setOnlineUsers: setOnlineUsers,
        setPendingInvitation: setPendingInvitation,
        setSentInvitation: setSentInvitation,
        resetGame: resetGame,
        setGame: setGame,
        updateBoard: updateBoard,
        setSelectedPiece: setSelectedPiece,
        setGameStatus: setGameStatus,
        setConnected: setConnected,
        isMyTurn: isMyTurn
    };

})();
