/* board.js - Trạng thái bàn cờ & quân cờ */

var Board = (function() {

    // Loại quân cờ
    var PIECE_TYPES = {
        KING: 'K',    // 将/帥
        ADVISOR: 'A', // 士/仕
        ELEPHANT: 'E',// 象/相
        HORSE: 'H',   // 馬
        CHARIOT: 'R', // 車
        CANNON: 'C',  // 炮/砲
        PAWN: 'P'     // 卒/兵
    };

    // Tên hiển thị theo màu
    var PIECE_NAMES = {
        red: {
            K: '帥',
            A: '仕',
            E: '相',
            H: '傌',
            R: '俥',
            C: '炮',
            P: '兵'
        },
        black: {
            K: '將',
            A: '士',
            E: '象',
            H: '馬',
            R: '車',
            C: '砲',
            P: '卒'
        }
    };

    // Tạo bàn cờ ban đầu
    // board[row][col] = { type, color } hoặc null
    // row 0 = trên cùng (black), row 9 = dưới cùng (red)
    function createInitial() {
        var board = [];
        for (var r = 0; r < 10; r++) {
            board[r] = [];
            for (var c = 0; c < 9; c++) {
                board[r][c] = null;
            }
        }

        // Hàng đen (hàng 0)
        board[0][0] = { type: 'R', color: 'black' };
        board[0][1] = { type: 'H', color: 'black' };
        board[0][2] = { type: 'E', color: 'black' };
        board[0][3] = { type: 'A', color: 'black' };
        board[0][4] = { type: 'K', color: 'black' };
        board[0][5] = { type: 'A', color: 'black' };
        board[0][6] = { type: 'E', color: 'black' };
        board[0][7] = { type: 'H', color: 'black' };
        board[0][8] = { type: 'R', color: 'black' };

        // Pháo đen (hàng 2)
        board[2][1] = { type: 'C', color: 'black' };
        board[2][7] = { type: 'C', color: 'black' };

        // Tốt đen (hàng 3)
        board[3][0] = { type: 'P', color: 'black' };
        board[3][2] = { type: 'P', color: 'black' };
        board[3][4] = { type: 'P', color: 'black' };
        board[3][6] = { type: 'P', color: 'black' };
        board[3][8] = { type: 'P', color: 'black' };

        // Tốt đỏ (hàng 6)
        board[6][0] = { type: 'P', color: 'red' };
        board[6][2] = { type: 'P', color: 'red' };
        board[6][4] = { type: 'P', color: 'red' };
        board[6][6] = { type: 'P', color: 'red' };
        board[6][8] = { type: 'P', color: 'red' };

        // Pháo đỏ (hàng 7)
        board[7][1] = { type: 'C', color: 'red' };
        board[7][7] = { type: 'C', color: 'red' };

        // Hàng đỏ (hàng 9)
        board[9][0] = { type: 'R', color: 'red' };
        board[9][1] = { type: 'H', color: 'red' };
        board[9][2] = { type: 'E', color: 'red' };
        board[9][3] = { type: 'A', color: 'red' };
        board[9][4] = { type: 'K', color: 'red' };
        board[9][5] = { type: 'A', color: 'red' };
        board[9][6] = { type: 'E', color: 'red' };
        board[9][7] = { type: 'H', color: 'red' };
        board[9][8] = { type: 'R', color: 'red' };

        return board;
    }

    function clone(board) {
        var copy = [];
        for (var r = 0; r < 10; r++) {
            copy[r] = [];
            for (var c = 0; c < 9; c++) {
                var p = board[r][c];
                copy[r][c] = p ? { type: p.type, color: p.color } : null;
            }
        }
        return copy;
    }

    function getPiece(board, col, row) {
        if (!Notation.isValidSquare(col, row)) return null;
        return board[row][col];
    }

    function setPiece(board, col, row, piece) {
        board[row][col] = piece;
    }

    function findKing(board, color) {
        for (var r = 0; r < 10; r++) {
            for (var c = 0; c < 9; c++) {
                var p = board[r][c];
                if (p && p.type === 'K' && p.color === color) {
                    return { col: c, row: r };
                }
            }
        }
        return null;
    }

    function getPieceName(piece) {
        if (!piece) return '';
        return PIECE_NAMES[piece.color][piece.type];
    }

    return {
        PIECE_TYPES: PIECE_TYPES,
        PIECE_NAMES: PIECE_NAMES,
        createInitial: createInitial,
        clone: clone,
        getPiece: getPiece,
        setPiece: setPiece,
        findKing: findKing,
        getPieceName: getPieceName
    };

})();
