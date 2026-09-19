/* notation.js - Chuyển đổi tọa độ & ký hiệu */

var Notation = (function() {

    // Cột: a-i (9 cột), Hàng: 0-9 (10 hàng)
    // a0 = góc trên trái (black side), i9 = góc dưới phải (red side)
    // Server dùng: "a3", "h7", v.v.

    var FILES = 'abcdefghi'; // 9 cột

    function colToFile(col) {
        return FILES[col];
    }

    function fileToCol(file) {
        return FILES.indexOf(file);
    }

    // row: 0 = hàng trên cùng (black), 9 = hàng dưới cùng (red)
    function toSquare(col, row) {
        return colToFile(col) + row;
    }

    function fromSquare(square) {
        var file = square[0];
        var row = parseInt(square[1], 10);
        return { col: fileToCol(file), row: row };
    }

    function isValidSquare(col, row) {
        return col >= 0 && col <= 8 && row >= 0 && row <= 9;
    }

    // Kiểm tra điểm có trong cung (cung đỏ: hàng 7-9, cột 3-5; cung đen: hàng 0-2, cột 3-5)
    function inPalace(col, row, color) {
        if (col < 3 || col > 5) return false;
        if (color === 'red') {
            return row >= 7 && row <= 9;
        } else {
            return row >= 0 && row <= 2;
        }
    }

    function inEitherPalace(col, row) {
        if (col < 3 || col > 5) return false;
        return (row >= 0 && row <= 2) || (row >= 7 && row <= 9);
    }

    // Kiểm tra đã qua sông hay chưa
    function crossedRiver(col, row, color) {
        if (color === 'red') {
            return row <= 4; // đỏ ở dưới, qua sông = lên hàng 0-4
        } else {
            return row >= 5; // đen ở trên, qua sông = xuống hàng 5-9
        }
    }

    return {
        colToFile: colToFile,
        fileToCol: fileToCol,
        toSquare: toSquare,
        fromSquare: fromSquare,
        isValidSquare: isValidSquare,
        inPalace: inPalace,
        inEitherPalace: inEitherPalace,
        crossedRiver: crossedRiver,
        FILES: FILES
    };

})();
