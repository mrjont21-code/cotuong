/* lobby.js - Xử lý phòng chờ & danh sách online */

var Lobby = (function() {

    function renderOnlineUsers() {
        var container = document.getElementById('online-list');
        var users = AppState.get().onlineUsers;
        var myId = AppState.get().guest.guest_id;

        if (!users || users.length === 0) {
            container.innerHTML = '<p class="empty-hint">Chưa có người khác online</p>';
            return;
        }

        var html = '';
        users.forEach(function(u) {
            var isSelf = u.guest_id === myId;
            html += '<div class="user-item' + (isSelf ? ' self' : '') + '" ' +
                   'data-guest-id="' + u.guest_id + '" ' +
                   'data-nickname="' + escapeHtml(u.nickname) + '">' +
                   escapeHtml(u.nickname) + '</div>';
        });
        container.innerHTML = html;

        // Gắn sự kiện click
        container.querySelectorAll('.user-item:not(.self)').forEach(function(el) {
            el.addEventListener('click', function() {
                var guestId = el.getAttribute('data-guest-id');
                var nickname = el.getAttribute('data-nickname');
                inviteUser(guestId, nickname);
            });
        });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function inviteUser(guestId, nickname) {
        // Gửi lời mời
        Network.send({ type: 'invite', from: AppState.get().guest.guest_id, to: guestId });
        AppState.setSentInvitation({ to: guestId, to_nickname: nickname });
        UI.showInviteSentOverlay();
    }

    function updateMyNicknameDisplay() {
        var el = document.getElementById('my-nickname');
        if (el) el.textContent = AppState.get().guest.nickname || '';
    }

    function updateConnectionStatus() {
        var el = document.getElementById('connection-status');
        if (!el) return;
        var state = AppState.get();
        if (state.network.connected) {
            el.textContent = Network.getMode() === 'mock' ? 'Chế độ demo (local)' : 'Đã kết nối';
        } else {
            el.textContent = 'Đang kết nối...';
        }
    }

    return {
        renderOnlineUsers: renderOnlineUsers,
        updateMyNicknameDisplay: updateMyNicknameDisplay,
        updateConnectionStatus: updateConnectionStatus
    };

})();
