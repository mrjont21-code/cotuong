/* game.js - Render bàn cờ & xử lý tương tác game */

var Game = (function() {

    var canvas, ctx;
    var boardSize = 0;
    var cellSize = 0;
    var padding = 0;
    var pieceRadius = 0;

    // Tọa độ giao điểm trên canvas (dựa theo tọa độ bàn cờ server: col 0-8, row 0-9)
    // row 0 = trên cùng (black), row 9 = dưới cùng (red)
    function intersectionPoint(col, row) {
        var myColor = AppState.get().game.myColor;
        var displayCol, displayRow;

        if (myColor === 'red') {
            // Đỏ nhìn từ dưới: col bình thường, row đảo ngược
            displayCol = col;
            displayRow = 9 - row;
        } else {
            // Đen nhìn từ trên: col đảo ngược, row bình thường
            displayCol = 8 - col;
            displayRow = row;
        }

        return {
            x: padding + displayCol * cellSize,
            y: padding + displayRow * cellSize
        };
    }

    // Chuyển từ tọa độ canvas về tọa độ bàn cờ
    function canvasToBoard(canvasX, canvasY) {
        var myColor = AppState.get().game.myColor;
        var displayCol = Math.round((canvasX - padding) / cellSize);
        var displayRow = Math.round((canvasY - padding) / cellSize);

        if (displayCol < 0 || displayCol > 8 || displayRow < 0 || displayRow > 9) {
            return null;
        }

        var col, row;
        if (myColor === 'red') {
            col = displayCol;
            row = 9 - displayRow;
        } else {
            col = 8 - displayCol;
            row = displayRow;
        }

        return { col: col, row: row };
    }

    function initCanvas() {
        canvas = document.getElementById('board-canvas');
        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', function() {
            resizeCanvas();
            draw();
        });
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('touchstart', handleTouch, { passive: false });
    }

    function resizeCanvas() {
        var container = document.getElementById('board-container');
        var availW = container.clientWidth - 16;
        var availH = container.clientHeight - 16;

        // Bàn cờ: 8 khoảng ngang, 9 khoảng dọc
        // Tỉ lệ W:H = 8:9
        var ratio = 8 / 9;
        var w, h;

        if (availW / availH > ratio) {
            h = availH;
            w = h * ratio;
        } else {
            w = availW;
            h = w / ratio;
        }

        boardSize = Math.min(w, h);
        var dpr = window.devicePixelRatio || 1;
        canvas.style.width = boardSize + 'px';
        canvas.style.height = (boardSize * 9 / 8) + 'px';
        canvas.width = Math.floor(boardSize * dpr);
        canvas.height = Math.floor(boardSize * 9 / 8 * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Tính lại kích thước thực tế cho vẽ
        var drawW = boardSize;
        var drawH = boardSize * 9 / 8;
        cellSize = drawW / 8;
        padding = cellSize * 0.7;
        // Điều chỉnh lại để lưới nằm gọn
        cellSize = (drawW - padding * 2) / 8;
        pieceRadius = cellSize * 0.42;
    }

    function draw() {
        if (!ctx) return;
        var state = AppState.get();
        if (!state.game.board) return;

        var drawW = boardSize;
        var drawH = boardSize * 9 / 8;

        // Nền bàn cờ
        ctx.fillStyle = '#e8c888';
        ctx.fillRect(0, 0, drawW, drawH);

        // Viền ngoài
        ctx.strokeStyle = '#2c1810';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding - 4, padding - 4, cellSize * 8 + 8, cellSize * 9 + 8);

        ctx.lineWidth = 1;

        // Đường ngang (10 hàng -> 9 khoảng)
        for (var r = 0; r <= 9; r++) {
            var y = padding + r * cellSize;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + 8 * cellSize, y);
            ctx.stroke();
        }

        // Đường dọc - bị ngắt ở sông
        for (var c = 0; c <= 8; c++) {
            var x = padding + c * cellSize;
            if (c === 0 || c === 8) {
                // Cột ngoài cùng - liên tục
                ctx.beginPath();
                ctx.moveTo(x, padding);
                ctx.lineTo(x, padding + 9 * cellSize);
                ctx.stroke();
            } else {
                // Nửa trên
                ctx.beginPath();
                ctx.moveTo(x, padding);
                ctx.lineTo(x, padding + 4 * cellSize);
                ctx.stroke();
                // Nửa dưới
                ctx.beginPath();
                ctx.moveTo(x, padding + 5 * cellSize);
                ctx.lineTo(x, padding + 9 * cellSize);
                ctx.stroke();
            }
        }

        // Chữ sông
        ctx.fillStyle = '#2c1810';
        ctx.font = 'bold ' + Math.floor(cellSize * 0.55) + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var riverY = padding + 4.5 * cellSize;
        ctx.fillText('楚 河', padding + 2 * cellSize, riverY);
        ctx.fillText('漢 界', padding + 6 * cellSize, riverY);

        // Cung trên
        drawPalace(padding + 3 * cellSize, padding,
                   padding + 5 * cellSize, padding + 2 * cellSize);
        // Cung dưới
        drawPalace(padding + 3 * cellSize, padding + 7 * cellSize,
                   padding + 5 * cellSize, padding + 9 * cellSize);

        // Highlight ô được chọn
        var selected = state.game.selectedPiece;
        if (selected) {
            var sp = intersectionPoint(selected.col, selected.row);
            ctx.strokeStyle = '#0066cc';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, pieceRadius + 3, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Highlight nước đi hợp lệ
        state.game.legalMoves.forEach(function(m) {
            var mp = intersectionPoint(m.col, m.row);
            var target = Board.getPiece(state.game.board, m.col, m.row);
            if (target) {
                // Ăn quân - vòng tròn
                ctx.strokeStyle = 'rgba(0, 150, 0, 0.8)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(mp.x, mp.y, pieceRadius + 2, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // Điểm trống - chấm nhỏ
                ctx.fillStyle = 'rgba(0, 150, 0, 0.6)';
                ctx.beginPath();
                ctx.arc(mp.x, mp.y, cellSize * 0.12, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Vẽ quân cờ
        for (var row = 0; row < 10; row++) {
            for (var col = 0; col < 9; col++) {
                var piece = Board.getPiece(state.game.board, col, row);
                if (piece) {
                    drawPiece(col, row, piece);
                }
            }
        }
    }

    function drawPalace(x1, y1, x2, y2) {
        ctx.strokeStyle = '#2c1810';
        ctx.lineWidth = 1;
        // Đường chéo 1
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        // Đường chéo 2
        ctx.beginPath();
        ctx.moveTo(x2, y1);
        ctx.lineTo(x1, y2);
        ctx.stroke();
    }

    function drawPiece(col, row, piece) {
        var p = intersectionPoint(col, row);
        var r = pieceRadius;

        // Hình tròn nền
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#f5e6c8';
        ctx.fill();

        // Viền ngoài
        ctx.strokeStyle = piece.color === 'red' ? '#8b0000' : '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Viền trong
        ctx.beginPath();
        ctx.arc(p.x, p.y, r - 4, 0, Math.PI * 2);
        ctx.strokeStyle = piece.color === 'red' ? '#8b0000' : '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Chữ quân
        ctx.fillStyle = piece.color === 'red' ? '#8b0000' : '#1a1a1a';
        ctx.font = 'bold ' + Math.floor(r * 1.1) + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Board.getPieceName(piece), p.x, p.y + 1);
    }

    function handleClick(e) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        processTap(x, y);
    }

    function handleTouch(e) {
        e.preventDefault();
        if (e.touches.length === 0) return;
        var rect = canvas.getBoundingClientRect();
        var t = e.touches[0];
        var x = t.clientX - rect.left;
        var y = t.clientY - rect.top;
        processTap(x, y);
    }

    function processTap(x, y) {
        var state = AppState.get();
        if (state.game.status !== 'PLAYING') return;
        if (!AppState.isMyTurn()) {
            UI.showGameMessage('Chưa đến lượt bạn');
            return;
        }

        var boardPos = canvasToBoard(x, y);
        if (!boardPos) return;

        var piece = Board.getPiece(state.game.board, boardPos.col, boardPos.row);
        var selected = state.game.selectedPiece;

        // Nếu đã chọn quân và tap vào nước hợp lệ
        if (selected) {
            var isLegal = state.game.legalMoves.some(function(m) {
                return m.col === boardPos.col && m.row === boardPos.row;
            });

            if (isLegal) {
                submitMove(selected.col, selected.row, boardPos.col, boardPos.row);
                return;
            }

            // Tap vào quân khác cùng màu -> chọn quân mới
            if (piece && piece.color === state.game.myColor) {
                AppState.setSelectedPiece(boardPos.col, boardPos.row);
                draw();
                return;
            }

            // Tap vào chỗ khác -> bỏ chọn
            AppState.setSelectedPiece(null, null);
            draw();
            return;
        }

        // Chưa chọn quân -> tap vào quân của mình
        if (piece && piece.color === state.game.myColor) {
            AppState.setSelectedPiece(boardPos.col, boardPos.row);
            draw();
        }
    }

    function submitMove(fromCol, fromRow, toCol, toRow) {
        var state = AppState.get();
        var from = Notation.toSquare(fromCol, fromRow);
        var to = Notation.toSquare(toCol, toRow);

        // Kiểm tra luật client-side trước
        if (!Rules.isValidMove(state.game.board, fromCol, fromRow, toCol, toRow)) {
            UI.showGameMessage('Nước đi không hợp lệ');
            return;
        }

        Network.send({
            type: 'move',
            game_id: state.game.game_id,
            from: from,
            to: to
        });

        // Bỏ chọn
        AppState.setSelectedPiece(null, null);
    }

    function handleMove(msg) {
        var state = AppState.get();
        if (msg.game_id !== state.game.game_id) return;

        var from = Notation.fromSquare(msg.from);
        var to = Notation.fromSquare(msg.to);

        var result = Rules.makeMove(state.game.board, from.col, from.row, to.col, to.row);
        AppState.updateBoard(result.board, msg.turn);
        draw();
        updatePlayerInfo();
    }

    function handleMoveRejected(msg) {
        var reason = msg.reason || 'Nước đi bị từ chối';
        if (reason === 'not_your_turn') reason = 'Chưa đến lượt bạn';
        else if (reason === 'illegal_move') reason = 'Nước đi không hợp lệ';
        UI.showGameMessage(reason);
        draw();
    }

    function handleGameStart(msg) {
        AppState.setGame(msg);
        AppState.setUI('UI_3_GAME');
        AppState.setSentInvitation(null);
        AppState.setPendingInvitation(null);
        UI.switchScreen('UI_3_GAME');
        UI.hideAllPopups();
        initCanvas();
        draw();
        updatePlayerInfo();
    }

    function handleGameEnd(msg) {
        var state = AppState.get();
        var result = msg.result;
        var text = '';

        if (result === 'red_win') {
            AppState.setGameStatus('RED_WIN');
            text = (state.game.myColor === 'red') ? 'BẠN THẮNG' : 'ĐỐI THỦ THẮNG';
        } else if (result === 'black_win') {
            AppState.setGameStatus('BLACK_WIN');
            text = (state.game.myColor === 'black') ? 'BẠN THẮNG' : 'ĐỐI THỦ THẮNG';
        } else if (result === 'draw') {
            AppState.setGameStatus('DRAW');
            text = 'HÒA';
        } else if (result === 'abandoned') {
            AppState.setGameStatus('ABANDONED');
            text = 'ĐỐI THỦ RỜI VÁN';
        }

        document.getElementById('game-result-text').textContent = text;
        document.getElementById('game-end-popup').classList.remove('hidden');
    }

    function handleOpponentDisconnected(msg) {
        document.getElementById('disconnect-popup').classList.remove('hidden');
    }

    function leaveGame() {
        var state = AppState.get();
        if (state.game.game_id) {
            Network.send({
                type: 'leave_game',
                game_id: state.game.game_id
            });
        }
        AppState.resetGame();
        UI.hideAllPopups();
        AppState.setUI('UI_2_LOBBY');
        UI.switchScreen('UI_2_LOBBY');
        Lobby.renderOnlineUsers();
    }

    function updatePlayerInfo() {
        var state = AppState.get();
        var g = state.game;
        if (!g.red || !g.black) return;

        var myColor = g.myColor;
        var opponentColor = (myColor === 'red') ? 'black' : 'red';

        // Tên đối thủ ở trên
        var opponent = (myColor === 'red') ? g.black : g.red;
        var me = (myColor === 'red') ? g.red : g.black;

        var opponentEl = document.getElementById('opponent-name');
        opponentEl.textContent = opponent.nickname;
        opponentEl.className = 'player-name ' + opponentColor;

        var myEl = document.getElementById('my-name');
        myEl.textContent = me.nickname + ' (' + (myColor === 'red' ? 'Đỏ' : 'Đen') + ')';
        myEl.className = 'player-name ' + myColor;

        // Lượt đi
        var turnEl = document.getElementById('turn-indicator');
        if (g.status === 'PLAYING') {
            if (AppState.isMyTurn()) {
                turnEl.textContent = 'Lượt bạn';
                turnEl.className = 'turn-indicator my-turn';
            } else {
                turnEl.textContent = 'Lượt đối thủ';
                turnEl.className = 'turn-indicator';
            }
        } else {
            turnEl.textContent = '';
        }
    }

    return {
        initCanvas: initCanvas,
        draw: draw,
        handleMove: handleMove,
        handleMoveRejected: handleMoveRejected,
        handleGameStart: handleGameStart,
        handleGameEnd: handleGameEnd,
        handleOpponentDisconnected: handleOpponentDisconnected,
        leaveGame: leaveGame,
        updatePlayerInfo: updatePlayerInfo,
        resizeCanvas: resizeCanvas
    };

})();
