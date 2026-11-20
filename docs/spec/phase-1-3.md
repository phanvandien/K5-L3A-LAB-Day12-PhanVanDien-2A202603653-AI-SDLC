# Spec và tiêu chí nghiệm thu — Phase 1–3

Nguồn yêu cầu: `hd1.md` (Contract 1.0), `hd2.md` (Ticket-02, Contract 1.1), `hd3.md` (Ticket-03, Contract 1.2). Contract 1.2 hiện hành. Ticket-03 thay thế điểm, thời lượng đêm, fuel/lamp, capacity và điều kiện thắng; các hành vi khác của phase trước vẫn được giữ.

## Phase 3: acceptance criteria

| Yêu cầu | Trạng thái triển khai/kiểm chứng |
|---|---|
| Contract | `contract_version` 1.2; tuning nhiên liệu/relight/win/drain/capacity khai báo trong `game.contract.json`; JSONL thêm fuel, `ever_lit`, `relit_count`, capacity, drain và event mới |
| Fuel chính xác | Dùng integer tick units: 60 = 1 fuel; hao nền 1 unit nội bộ/tick; snapshot làm tròn 1 chữ số |
| Thắp/châm dầu | Thắp mới cần10, nạp phần tiến độ được; đèn đang sáng nạp theo `ceil((100-fuel)/10)`; cap100; không chọn đèn đầy |
| Thắp lại | Tắt đèn giữ `ever_lit`; nạp đủ5 thì fuel100, relit_count tăng; có `lantern_lit.relight`; cạn dầu phát `lantern_out` |
| Fuel UI | Thanh nhiên liệu trên đèn, nhấp nháy dưới30; đèn tắt có hình bẹp và rách. Có mã màu dễ phân biệt với viền/mắt Bóng Mực cyan và cảnh báo trắng kèm ⚠ |
| An toàn | Chỉ đèn sáng fuel≥30 giữ bán kính6; từ30 trở xuống/đèn tắt không bảo vệ; khi đèn sáng/châm qua ngưỡng, shade trong vùng được đẩy ra và tạm không gây hit |
| Drain shade | Shade wander chọn đèn yếu gần nhất trước, nếu không có thì hướng đến đèn tắt; trong2m đứng hút5 fuel/s; event `fuel_drain` mỗi60 tick; chase/stun/wander theo điều kiện Ticket-03 |
| Score pulse | +5 mỗi shade bình thường, +15 nếu shade đang drain; regression pulse thường kiểm tra trong scenario |
| Bình minh | 240/270/300 giây; không kết thúc sớm; cần lần lượt3/4/5 đèn còn sáng; no_flames ưu tiên; reason `dawn_survived`, `dawn`, `no_flames` |
| Capacity | 10 +2 mỗi lần thắp/thắp lại thành công, max20; scenario đặt đèn sáng không tính vào successful_lights |
| Điểm | +5/mote nạp, +100 lần thắp đầu, +40 lần thắp lại; thắng nhận 50+floor(fuel) mỗi đèn sáng và 50 mỗi lửa; không thưởng thời gian |
| Regressions | Suite chạy lại pickup/deposit, dash, pads, pulse, hit, drifter, bùa, pause, ba map và format scenario Phase 1; luật cũ bị thay được cập nhật thay vì skip |
| Tốc độ headless | Một đêm Đêm 3 18.000 tick chạy trong giới hạn30s; thời gian máy hiện tại lưu trong proof JSON |

## Thứ tự xử lý

Input/pause → giảm timer → hao dầu và drain; tắt đèn hết dầu → di chuyển/rơi → pickup → tương tác → cập nhật safe zone → pulse → di chuyển shade/drifter → va chạm → spawn/gió → điều kiện thắng/thua → snapshot. `checkEnd` không kết thúc sớm; chỉ kết thúc khi hết lửa hoặc timer bình minh chạm0.

## Những giới hạn chưa nghiệm thu

- Hình ảnh vẫn là Canvas 2.5D, không phải game renderer 3D đầy đủ; hình học cầu/tầng/tường và vật cản còn giản lược.
- Chưa đo 30 FPS giao diện ở 1280×720; đã đo riêng tốc độ headless.
- Audio tổng hợp và một số HUD đã có, nhưng chưa được nghe/xem kiểm thử trong trình duyệt và chưa bảo đảm toàn bộ âm thanh ticket.
- Chưa có clip demo; chưa tạo tag Git hoặc Release. Chưa có test ẩn của giảng viên.
