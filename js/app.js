/* app.js - Điểm vào chính, gắn sự kiện & điều phối */

(function() {

    function init() {
        bindEvents();
        bindNetworkHandlers();

        // Kiểm tra guest đã lưu
        if (AppState.loadGuest() && AppState.get().guest.guest_id) {
            // Đã có guest, tự động vào lobby
            enterLobby();
        } else {
            AppState.setUI('UI_1_NICKNAME');
            UI.switchScreen('UI_1_NICKNAME');
        }
    }

    function bindEvents() {
        // UI 1: Nickname
        document.getElementById('nickname-confirm').addEventListener('click', handleNicknameSubmit);
        document.getElementById('nickname-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleNicknameSubmit();
        });

        // Invitation popup
        document.getElementById('invite-accept').addEventListener('click', function() {
            Invitation.accept();
        });
        document.getElementById('invite-decline').addEventListener('click', function() {
            Invitation.decline();
        });

        // Cancel sent invitation
        document.getElementById('cancel-invite').addEventListener('click', function() {
            Invitation.cancelSent();
        });

        // Game end
        document.getElementById('leave-game').addEventListener('click', function() {
            Game.leaveGame();
        });

        // Disconnect popup
        document.getElementById('disconnect-leave').addEventListener('click', function() {
            Game.leaveGame();
        });

        // Dọn dẹp khi đóng tab
        window.addEventListener('beforeunload', function() {
            var state = AppState.get();
            if (state.guest.guest_id) {
                // Mock mode cleanup
                if (Network.getMode() === 'mock') {
                    Network.send({ type: 'leave', guest_id: state.guest.guest_id });
                }
            }
        });
    }

    function bindNetworkHandlers() {
        Network.on('connected', function() {
            Lobby.updateConnectionStatus();
        });

        Network.on('disconnected', function() {
            Lobby.updateConnectionStatus();
            UI.showGameMessage('Mất kết nối');
        });

        Network.on('join_accepted', function(msg) {
            AppState.setGuest(msg.guest.guest_id, msg.guest.nickname);
            AppState.setUI('UI_2_LOBBY');
            UI.switchScreen('UI_2_LOBBY');
            Lobby.updateMyNicknameDisplay();
            Lobby.updateConnectionStatus();
        });

        Network.on('online_users', function(msg) {
            AppState.setOnlineUsers(msg.users);
            Lobby.renderOnlineUsers();
        });

        Network.on('invitation_received', function(msg) {
            Invitation.showReceived(msg.invitation_id, msg.from_nickname);
        });

        Network.on('invitation_declined', function() {
            Invitation.handleDeclined();
        });

        Network.on('invitation_cancelled', function() {
            Invitation.handleCancelled();
        });

        Network.on('invite_rejected', function(msg) {
            Invitation.handleDeclined();
            var reason = msg.reason === 'opponent_busy' ? 'Đối thủ đang bận' : 'Không thể mời';
            UI.showGameMessage(reason);
        });

        Network.on('game_start', function(msg) {
            Game.handleGameStart(msg);
        });

        Network.on('move', function(msg) {
            Game.handleMove(msg);
        });

        Network.on('move_rejected', function(msg) {
            Game.handleMoveRejected(msg);
        });

        Network.on('game_end', function(msg) {
            Game.handleGameEnd(msg);
        });

        Network.on('opponent_disconnected', function(msg) {
            Game.handleOpponentDisconnected(msg);
        });
    }

    function handleNicknameSubmit() {
        var input = document.getElementById('nickname-input');
        var result = Guest.submitNickname(input.value);

        if (!result.valid) {
            UI.showNicknameError(result.error);
            return;
        }

        UI.hideNicknameError();
        enterLobby();
    }

    function enterLobby() {
        var guest = AppState.get().guest;
        AppState.setUI('UI_2_LOBBY');
        UI.switchScreen('UI_2_LOBBY');
        Lobby.updateMyNicknameDisplay();
        Lobby.updateConnectionStatus();
        Network.connect(guest);
    }

    // Khởi động khi DOM sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
