# MINIMAL XIANGQI WEBGAME v1.0

Webgame cờ tướng 1v1 online tối giản, deploy frontend trên GitHub Pages.

## Cấu trúc

```
xiangqi-web/
├── index.html              # Trang duy nhất (SPA 3 UI states)
├── css/
│   ├── base.css            # Reset & styles chung
│   ├── ui1.css             # UI 1: Nickname
│   ├── ui2.css             # UI 2: Lobby
│   └── ui3.css             # UI 3: Game
├── js/
│   ├── app.js              # Điểm vào chính, gắn sự kiện
│   ├── state.js            # Trạng thái toàn cục
│   ├── ui.js               # Điều khiển UI chung
│   ├── guest.js            # Xử lý guest identity
│   ├── lobby.js            # Phòng chờ & danh sách online
│   ├── invitation.js       # Xử lý lời mời
│   ├── game.js             # Render bàn cờ & tương tác
│   └── network.js          # Giao tiếp mạng (WebSocket + Mock)
├── xiangqi/
│   ├── board.js            # Trạng thái bàn cờ & quân cờ
│   ├── rules.js            # Luật cờ tướng
│   └── notation.js         # Ký hiệu & tọa độ
└── assets/
    └── pieces/             # (Tùy chọn) Hình ảnh quân cờ SVG
```

## Chạy thử (Demo mode)

Mở `index.html` trực tiếp trong trình duyệt. Mặc định chạy ở chế độ **Mock** — giả lập backend bằng `localStorage`, cho phép test 2 client trên **cùng một máy / cùng trình duyệt** (mở 2 tab/cửa sổ).

## Chế độ hoạt động

### 1. Mock Mode (mặc định)
- Không cần backend
- Dùng `localStorage` + `storage` event để giao tiếp giữa các tab
- Chỉ hoạt động trên cùng một trình duyệt
- Phù hợp để test UI & luật cờ

### 2. WebSocket Mode (thực tế)
Sửa `WEBSOCKET_URL` trong `js/network.js`:
```javascript
var WEBSOCKET_URL = 'wss://your-backend.com/ws';
```

## Deploy lên GitHub Pages

1. Tạo repo GitHub
2. Push toàn bộ thư mục `xiangqi-web/` lên
3. Vào **Settings → Pages**
4. Chọn branch `main`, thư mục `/docs` (hoặc `/root`)
5. Frontend sẽ được phục vụ tại `https://USERNAME.github.io/xiangqi-web/`

**Lưu ý:** GitHub Pages chỉ phục vụ file tĩnh. Để chơi online thật, cần một WebSocket backend riêng.

## WebSocket Protocol (Backend cần implement)

### Client → Server

| type | fields | mô tả |
|---|---|---|
| `join` | `guest: {guest_id, nickname}` | Tham gia server |
| `leave` | `guest_id` | Rời server |
| `invite` | `to` (guest_id) | Mời người chơi |
| `invite_accept` | `invitation_id` | Chấp nhận lời mời |
| `invite_decline` | `invitation_id` | Từ chối lời mời |
| `cancel_invite` | `invitation_id` | Hủy lời mời đã gửi |
| `move` | `game_id, from, to` | Gửi nước đi |
| `leave_game` | `game_id` | Rời ván |

### Server → Client

| type | fields | mô tả |
|---|---|---|
| `join_accepted` | `guest` | Xác nhận tham gia |
| `online_users` | `users: [{guest_id, nickname}]` | Danh sách online |
| `invitation_received` | `invitation_id, from, from_nickname` | Nhận lời mời |
| `invitation_declined` | `invitation_id` | Lời mời bị từ chối |
| `invitation_cancelled` | `invitation_id` | Lời mời bị hủy |
| `invite_rejected` | `reason` | Server từ chối lời mời |
| `game_start` | `game_id, red, black, turn` | Bắt đầu ván |
| `move` | `game_id, from, to, turn` | Nước đi hợp lệ |
| `move_rejected` | `game_id, reason` | Nước đi bị từ chối |
| `game_end` | `game_id, result` | Kết thúc ván |
| `opponent_disconnected` | `game_id` | Đối thủ mất kết nối |

### Ký hiệu ô cờ
- Cột: `a` đến `i` (9 cột)
- Hàng: `0` đến `9` (10 hàng)
- `a0` = góc trên trái (đen), `i9` = góc dưới phải (đỏ)
- Ví dụ: `from: "a3", to: "a4"`

## Nguyên tắc v1

- Không tài khoản / password / email
- Không avatar / chat / bảng xếp hạng / đồng hồ
- Không animation thừa
- Server là authority cuối cùng (luật cờ, lượt đi, kết quả)
