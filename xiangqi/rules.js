/* rules.js - Luật cờ tướng */

var Rules = (function() {

    // Lấy danh sách nước đi hợp lệ cho một quân cờ tại (col, row)
    function getLegalMoves(board, col, row) {
        var piece = Board.getPiece(board, col, row);
        if (!piece) return [];

        var moves = [];
        switch (piece.type) {
            case 'K': moves = kingMoves(board, col, row, piece.color); break;
            case 'A': moves = advisorMoves(board, col, row, piece.color); break;
            case 'E': moves = elephantMoves(board, col, row, piece.color); break;
            case 'H': moves = horseMoves(board, col, row, piece.color); break;
            case 'R': moves = chariotMoves(board, col, row, piece.color); break;
            case 'C': moves = cannonMoves(board, col, row, piece.color); break;
            case 'P': moves = pawnMoves(board, col, row, piece.color); break;
        }

        // Lọc nước đi khiến tướng bị chiếu
        return moves.filter(function(m) {
            return !moveLeavesKingInCheck(board, col, row, m.col, m.row, piece.color);
        });
    }

    function addMove(moves, board, col, row, color) {
        if (!Notation.isValidSquare(col, row)) return;
        var target = Board.getPiece(board, col, row);
        if (!target || target.color !== color) {
            moves.push({ col: col, row: row });
        }
    }

    function kingMoves(board, col, row, color) {
        var moves = [];
        var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
        for (var i = 0; i < dirs.length; i++) {
            var nc = col + dirs[i][0];
            var nr = row + dirs[i][1];
            if (Notation.inPalace(nc, nr, color)) {
                addMove(moves, board, nc, nr, color);
            }
        }
        return moves;
    }

    function advisorMoves(board, col, row, color) {
        var moves = [];
        var dirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
        for (var i = 0; i < dirs.length; i++) {
            var nc = col + dirs[i][0];
            var nr = row + dirs[i][1];
            if (Notation.inPalace(nc, nr, color)) {
                addMove(moves, board, nc, nr, color);
            }
        }
        return moves;
    }

    function elephantMoves(board, col, row, color) {
        var moves = [];
        var dirs = [[2,2],[2,-2],[-2,2],[-2,-2]];
        var blocks = [[1,1],[1,-1],[-1,1],[-1,-1]];
        for (var i = 0; i < dirs.length; i++) {
            var nc = col + dirs[i][0];
            var nr = row + dirs[i][1];
            var bc = col + blocks[i][0];
            var br = row + blocks[i][1];
            if (!Notation.isValidSquare(nc, nr)) continue;
            // Tượng không qua sông
            if (color === 'red' && nr < 5) continue;
            if (color === 'black' && nr > 4) continue;
            // Kiểm tra bị cản
            if (Board.getPiece(board, bc, br)) continue;
            addMove(moves, board, nc, nr, color);
        }
        return moves;
    }

    function horseMoves(board, col, row, color) {
        var moves = [];
        // [deltaCol, deltaRow, blockCol, blockRow]
        var steps = [
            [ 1,  2,  0,  1],
            [-1,  2,  0,  1],
            [ 1, -2,  0, -1],
            [-1, -2,  0, -1],
            [ 2,  1,  1,  0],
            [ 2, -1,  1,  0],
            [-2,  1, -1,  0],
            [-2, -1, -1,  0]
        ];
        for (var i = 0; i < steps.length; i++) {
            var s = steps[i];
            var nc = col + s[0];
            var nr = row + s[1];
            var bc = col + s[2];
            var br = row + s[3];
            if (!Notation.isValidSquare(nc, nr)) continue;
            if (Board.getPiece(board, bc, br)) continue; // bị cản chân
            addMove(moves, board, nc, nr, color);
        }
        return moves;
    }

    function chariotMoves(board, col, row, color) {
        var moves = [];
        var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
        for (var i = 0; i < dirs.length; i++) {
            var d = dirs[i];
            var nc = col + d[0];
            var nr = row + d[1];
            while (Notation.isValidSquare(nc, nr)) {
                var target = Board.getPiece(board, nc, nr);
                if (!target) {
                    moves.push({ col: nc, row: nr });
                } else {
                    if (target.color !== color) {
                        moves.push({ col: nc, row: nr });
                    }
                    break;
                }
                nc += d[0];
                nr += d[1];
            }
        }
        return moves;
    }

    function cannonMoves(board, col, row, color) {
        var moves = [];
        var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
        for (var i = 0; i < dirs.length; i++) {
            var d = dirs[i];
            var nc = col + d[0];
            var nr = row + d[1];
            // Di chuyển bình thường (chưa gặp quân cản)
            while (Notation.isValidSquare(nc, nr) && !Board.getPiece(board, nc, nr)) {
                moves.push({ col: nc, row: nr });
                nc += d[0];
                nr += d[1];
            }
            // Đã gặp quân cản, tìm quân tiếp theo để ăn
            if (Notation.isValidSquare(nc, nr)) {
                nc += d[0];
                nr += d[1];
                while (Notation.isValidSquare(nc, nr)) {
                    var target = Board.getPiece(board, nc, nr);
                    if (target) {
                        if (target.color !== color) {
                            moves.push({ col: nc, row: nr });
                        }
                        break;
                    }
                    nc += d[0];
                    nr += d[1];
                }
            }
        }
        return moves;
    }

    function pawnMoves(board, col, row, color) {
        var moves = [];
        var forward = (color === 'red') ? -1 : 1;
        // Đi thẳng
        var nc = col;
        var nr = row + forward;
        if (Notation.isValidSquare(nc, nr)) {
            addMove(moves, board, nc, nr, color);
        }
        // Đã qua sông -> có thể đi ngang
        if (Notation.crossedRiver(col, row, color)) {
            nc = col - 1;
            nr = row;
            if (Notation.isValidSquare(nc, nr)) {
                addMove(moves, board, nc, nr, color);
            }
            nc = col + 1;
            if (Notation.isValidSquare(nc, nr)) {
                addMove(moves, board, nc, nr, color);
            }
        }
        return moves;
    }

    // Kiểm tra nước đi có để tướng bị chiếu không
    function moveLeavesKingInCheck(board, fromCol, fromRow, toCol, toRow, color) {
        var testBoard = Board.clone(board);
        var piece = Board.getPiece(testBoard, fromCol, fromRow);
        Board.setPiece(testBoard, fromCol, fromRow, null);
        Board.setPiece(testBoard, toCol, toRow, piece);
        return isInCheck(testBoard, color);
    }

    // Kiểm tra tướng color có đang bị chiếu không
    function isInCheck(board, color) {
        var kingPos = Board.findKing(board, color);
        if (!kingPos) return true;

        var enemy = (color === 'red') ? 'black' : 'red';

        // Kiểm tra tướng đối mặt (flying general)
        var enemyKing = Board.findKing(board, enemy);
        if (enemyKing && enemyKing.col === kingPos.col) {
            var blocked = false;
            var minRow = Math.min(kingPos.row, enemyKing.row);
            var maxRow = Math.max(kingPos.row, enemyKing.row);
            for (var r = minRow + 1; r < maxRow; r++) {
                if (Board.getPiece(board, kingPos.col, r)) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) return true;
        }

        // Kiểm tra từng quân địch
        for (var r = 0; r < 10; r++) {
            for (var c = 0; c < 9; c++) {
                var p = Board.getPiece(board, c, r);
                if (p && p.color === enemy) {
                    var attacks = getAttackSquares(board, c, r, p);
                    for (var i = 0; i < attacks.length; i++) {
                        if (attacks[i].col === kingPos.col && attacks[i].row === kingPos.row) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    // Lấy các ô mà quân cờ tấn công (không kiểm tra chiếu sau khi di chuyển)
    function getAttackSquares(board, col, row, piece) {
        switch (piece.type) {
            case 'K': return kingMoves(board, col, row, piece.color);
            case 'A': return advisorMoves(board, col, row, piece.color);
            case 'E': return elephantMoves(board, col, row, piece.color);
            case 'H': return horseMoves(board, col, row, piece.color);
            case 'R': return chariotMoves(board, col, row, piece.color);
            case 'C': return cannonMoves(board, col, row, piece.color);
            case 'P': return pawnMoves(board, col, row, piece.color);
        }
        return [];
    }

    // Kiểm tra một nước đi có hợp lệ không
    function isValidMove(board, fromCol, fromRow, toCol, toRow) {
        var piece = Board.getPiece(board, fromCol, fromRow);
        if (!piece) return false;
        var moves = getLegalMoves(board, fromCol, fromRow);
        for (var i = 0; i < moves.length; i++) {
            if (moves[i].col === toCol && moves[i].row === toRow) {
                return true;
            }
        }
        return false;
    }

    // Thực hiện nước đi (trả về bàn cờ mới)
    function makeMove(board, fromCol, fromRow, toCol, toRow) {
        var newBoard = Board.clone(board);
        var piece = Board.getPiece(newBoard, fromCol, fromRow);
        var captured = Board.getPiece(newBoard, toCol, toRow);
        Board.setPiece(newBoard, fromCol, fromRow, null);
        Board.setPiece(newBoard, toCol, toRow, piece);
        return { board: newBoard, captured: captured };
    }

    // Kiểm tra chiếu bí
    function isCheckmate(board, color) {
        if (!isInCheck(board, color)) return false;
        return !hasAnyLegalMove(board, color);
    }

    // Kiểm tra hòa (cờ bí - không có nước đi hợp lệ nhưng không bị chiếu)
    function isStalemate(board, color) {
        if (isInCheck(board, color)) return false;
        return !hasAnyLegalMove(board, color);
    }

    function hasAnyLegalMove(board, color) {
        for (var r = 0; r < 10; r++) {
            for (var c = 0; c < 9; c++) {
                var p = Board.getPiece(board, c, r);
                if (p && p.color === color) {
                    var moves = getLegalMoves(board, c, r);
                    if (moves.length > 0) return true;
                }
            }
        }
        return false;
    }

    return {
        getLegalMoves: getLegalMoves,
        isValidMove: isValidMove,
        makeMove: makeMove,
        isInCheck: isInCheck,
        isCheckmate: isCheckmate,
        isStalemate: isStalemate
    };

})();
