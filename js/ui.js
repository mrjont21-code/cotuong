/* ui.js - Điều khiển UI chung */

var UI = (function() {

    function switchScreen(uiName) {
        document.querySelectorAll('.screen').forEach(function(s) {
            s.classList.remove('active');
        });
        var screenId = uiName.replace('UI_1_NICKNAME', 'ui1')
                            .replace('UI_2_LOBBY', 'ui2')
                            .replace('UI_3_GAME', 'ui3');
        var el = document.getElementById(screenId);
        if (el) el.classList.add('active');

        // Resize canvas khi vào game
        if (uiName === 'UI_3_GAME') {
            setTimeout(function() {
                Game.resizeCanvas();
                Game.draw();
                Game.updatePlayerInfo();
            }, 50);
        }
    }

    function showNicknameError(msg) {
        var el = document.getElementById('nickname-error');
        el.textContent = msg || '';
    }

    function hideNicknameError() {
        showNicknameError('');
    }

    function showInviteSentOverlay() {
        document.getElementById('invite-sent-overlay').classList.remove('hidden');
    }

    function hideInviteSentOverlay() {
        document.getElementById('invite-sent-overlay').classList.add('hidden');
    }

    function hideAllPopups() {
        document.getElementById('invitation-popup').classList.add('hidden');
        document.getElementById('invite-sent-overlay').classList.add('hidden');
        document.getElementById('game-end-popup').classList.add('hidden');
        document.getElementById('disconnect-popup').classList.add('hidden');
    }

    var msgTimeout = null;
    function showGameMessage(text, duration) {
        var el = document.getElementById('game-message');
        el.textContent = text;
        el.classList.add('visible');
        if (msgTimeout) clearTimeout(msgTimeout);
        msgTimeout = setTimeout(function() {
            el.classList.remove('visible');
        }, duration || 2000);
    }

    return {
        switchScreen: switchScreen,
        showNicknameError: showNicknameError,
        hideNicknameError: hideNicknameError,
        showInviteSentOverlay: showInviteSentOverlay,
        hideInviteSentOverlay: hideInviteSentOverlay,
        hideAllPopups: hideAllPopups,
        showGameMessage: showGameMessage
    };

})();
