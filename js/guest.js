/* guest.js - Xử lý guest identity */

var Guest = (function() {

    function generateGuestId() {
        return 'g_' + Math.random().toString(36).substr(2, 8) + Date.now().toString(36).substr(-4);
    }

    function validateNickname(nickname) {
        if (!nickname) return { valid: false, error: 'Vui lòng nhập nickname' };
        var trimmed = nickname.trim();
        if (trimmed.length === 0) return { valid: false, error: 'Nickname không được rỗng' };
        if (trimmed.length > 20) return { valid: false, error: 'Nickname tối đa 20 ký tự' };
        // Kiểm tra ký tự điều khiển
        for (var i = 0; i < trimmed.length; i++) {
            var code = trimmed.charCodeAt(i);
            if (code < 32 || code === 127) {
                return { valid: false, error: 'Nickname chứa ký tự không hợp lệ' };
            }
        }
        return { valid: true, nickname: trimmed };
    }

    function submitNickname(nicknameInput) {
        var result = validateNickname(nicknameInput);
        if (!result.valid) return result;

        var guest_id = generateGuestId();
        AppState.setGuest(guest_id, result.nickname);
        return { valid: true, guest_id: guest_id, nickname: result.nickname };
    }

    return {
        generateGuestId: generateGuestId,
        validateNickname: validateNickname,
        submitNickname: submitNickname
    };

})();
