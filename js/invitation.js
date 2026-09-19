/* invitation.js - Xử lý lời mời */

var Invitation = (function() {

    function showReceived(invitation_id, from_nickname) {
        AppState.setPendingInvitation({
            invitation_id: invitation_id,
            from_nickname: from_nickname
        });
        document.getElementById('invitation-text').textContent =
            '"' + from_nickname + ' rủ bạn thách đấu"';
        document.getElementById('invitation-popup').classList.remove('hidden');
    }

    function hideReceived() {
        document.getElementById('invitation-popup').classList.add('hidden');
        AppState.setPendingInvitation(null);
    }

    function accept() {
        var inv = AppState.get().pendingInvitation;
        if (!inv) return;
        Network.send({
            type: 'invite_accept',
            invitation_id: inv.invitation_id
        });
        hideReceived();
    }

    function decline() {
        var inv = AppState.get().pendingInvitation;
        if (!inv) return;
        Network.send({
            type: 'invite_decline',
            invitation_id: inv.invitation_id
        });
        hideReceived();
    }

    function cancelSent() {
        var sent = AppState.get().sentInvitation;
        if (sent && sent.invitation_id) {
            Network.send({
                type: 'cancel_invite',
                invitation_id: sent.invitation_id
            });
        }
        AppState.setSentInvitation(null);
        UI.hideInviteSentOverlay();
    }

    function handleDeclined() {
        AppState.setSentInvitation(null);
        UI.hideInviteSentOverlay();
        UI.showGameMessage('Đối thủ đã từ chối');
    }

    function handleCancelled() {
        hideReceived();
    }

    return {
        showReceived: showReceived,
        hideReceived: hideReceived,
        accept: accept,
        decline: decline,
        cancelSent: cancelSent,
        handleDeclined: handleDeclined,
        handleCancelled: handleCancelled
    };

})();
