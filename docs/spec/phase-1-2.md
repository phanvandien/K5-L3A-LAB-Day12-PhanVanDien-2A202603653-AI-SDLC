# Spec và tiêu chí nghiệm thu — Phase 1–2

Tài liệu lịch sử cho `hd1.md` (PRD-0, Contract 1.0) và `hd2.md` (Ticket-02, Contract 1.1). Ticket-03 thay thế một số luật; xem [spec Phase 1–3](phase-1-3.md) và [ADR-003](../notes/ADR-003-fuel-and-dawn.md) để biết luật đang có hiệu lực.

## Acceptance criteria

| Yêu cầu | Tiêu chí nghiệm thu | Trạng thái hiện tại |
|---|---|---|
| Chạy headless | CLI nhận seed, night, scenario, inputs, ticks, snapshot interval và out; JSONL có snapshot tick 0, event và record end | Đạt theo kiểm tra tự động |
| Tính tất định | Hai lần chạy cùng seed/scenario/inputs tạo cùng JSONL | Đạt theo kiểm tra tự động |
| Đêm 1 và hồi quy | Có năm đèn L1–L5; scene scenario cũ nhận mote dạng mảng tọa độ; pickup, deposit và điểm hoạt động | Đạt phần contract được kiểm tra; chưa có toàn bộ test ẩn |
| Chạy và nhảy | Di chuyển 6 m/s, nhảy 7 m/s, trọng lực −20 m/s²; chạy headless theo bước 1/60 s | Lõi có số liệu chuẩn; chưa có kiểm tra chuyển động giao diện đầy đủ |
| Dash | 14 m/s trong 12 tick, hồi 90 tick, event `dash`; bùa bỏ hồi chiêu | Đạt theo kiểm tra scenario cơ bản |
| Mote/đèn | Sức chứa 10; nhặt ≤1 m; tương tác ≤2 m; nạp số lượng còn thiếu; +10/đom đóm nạp, +100/đèn sáng | Đạt cho pickup/deposit; cần test mở rộng cho tất cả biên khoảng cách |
| Tỏa Sáng | Trừ 3; hồi 180 tick; chọn mục tiêu trong bán kính 3D 5 m; choáng 120 tick, đẩy 4 m/15 tick, +5 mỗi mục tiêu | Đạt một scenario mục tiêu; thiếu scenario biên/vật cản và làm mới choáng |
| Bóng Mực | Phát hiện 12 m, bỏ đuổi 18 m; tốc độ 4 m/s (4.5 ở Đêm 3); hit mất một lửa, rơi floor(mang/2), bất tử 90 tick | Có mô phỏng và kiểm tra hit cơ bản; chưa kiểm tra đầy đủ vật cản, vùng an toàn và lịch spawn |
| Ba bản đồ | Đêm 1 có 5 đèn, Đêm 2 có 6, Đêm 3 có 7; thời lượng 300/330/360 s; nhịp gió Đêm 3 được kiểm tra | Đạt các số lượng và thời lượng; hình dạng tầng/đảo được đơn giản hóa trong renderer |
| Bục nhảy | Bục Đêm 2 phóng 24 m/s ngang, 14 m/s lên; bục Đêm 3 phóng 8 m/s ngang, 12 m/s lên; vận tốc phóng giữ tới khi chạm đất | Có logic trong simulation; chưa có scenario chứng minh quỹ đạo và điểm đáp |
| Gió Lạc | Idle/chase/flee, phát hiện khi mang ≥5 trong 15 m, trộm tối đa 3, pulse tương tác, TTL biến mất | Đạt scenario trộm; chưa kiểm tra pulse-drop và toàn bộ thời gian bay |
| Bùa Gió | Thời gian 600 tick, tốc độ 7.2 m/s, lướt không hồi, xuất hiện lại sau 2700 tick | Pickup/timer đã kiểm tra; chưa kiểm tra hết hạn và hồi sinh |
| Pause | Nút pause đóng băng sim tick và tiếp tục chính xác khi resume | Đạt scenario |
| HUD/cài đặt | Lửa, đồng hồ, đèn/điểm, 10 ô mote, cooldown; pause và cài đặt lưu local | Có UI code; chưa kiểm tra trực quan trên trình duyệt |
| Phong cách 3D | Mây đội nón và đèn; đèn vàng, Bóng Mực tím; đảo đổi ánh sáng theo tiến độ | Có hình ảnh Canvas 2.5D cơ bản; yêu cầu renderer 3D thực và tăng sáng toàn đảo chưa đạt |
| Âm thanh | Nhạc nền và hiệu ứng cho các hành động/sự kiện được liệt kê trong Ticket-02 | Có loop nền và âm tổng hợp cho pickup, thắp đèn, nhảy, lướt, pulse, bị đánh, Bóng Mực sinh và 10 giây cuối; chưa kiểm tra trong trình duyệt và chưa có đủ hiệu ứng theo ticket |
| Performance | Chạy headless đêm 3 tới 21.600 tick trong ≤30 giây | Đạt trong kiểm tra hiện tại; thời gian cụ thể lưu trong JSON proof |

## Giả định được dùng

1. `hd2.md` Contract 1.1 thay thế số liệu tuning của Phase 1 nhưng không thay cấu trúc scenario đầu vào cũ; vì vậy `motes` chấp nhận cả `[x,y,z]` cũ và object mới.
2. Headless luôn tắt hiệu ứng/trang trí không ảnh hưởng gameplay. Random entities được bật mặc định; cờ scenario có thể tắt để tái lập tình huống.
3. Tên điểm trong `score` áp dụng lúc nạp đom đóm vào đèn, không phải khi chỉ nhặt lên; điểm thắp đèn cộng riêng.
4. Dùng Canvas 2D tự dựng để tránh phụ thuộc thư viện tải qua mạng. Đây là hình ảnh chiếu 2.5D, không được tính là hoàn tất yêu cầu 3D dựng hình thật.
5. Tọa độ các đèn Đêm 2 và Đêm 3 dùng nguyên văn từ Ticket-02; phần địa hình ở bản chơi hiện là mô hình va chạm giản lược.

## Thứ tự tick được triển khai

Input và pause → giảm timer → di chuyển Mây/kiểm tra rơi → pickup → tương tác đèn → vùng an toàn → Tỏa Sáng → di chuyển địch → va chạm (Gió Lạc trước Bóng Mực) → sinh thực thể/gió → thắng thua. Snapshot phát ra sau bước đã hoàn tất. Khi pause, `tick` ngoài vẫn tăng nhưng `sim_tick` và thời gian gameplay dừng.

## Những việc cần hoàn thiện trước khi tuyên bố đạt toàn bộ Ticket

- Dựng địa hình nhiều tầng, cầu, bục và tháp ở renderer 3D; kiểm tra visual tại 1280×720 và đo FPS.
- Thêm cảnh báo gió trước 2 giây, toàn bộ nhạc/âm thanh và mũi tên định hướng đèn ngoài màn hình.
- Bổ sung scenario cho các biên khoảng cách/timer, vật cản, lướt khi có bùa, drop của Gió Lạc, cướp khi bất tử, va chạm ở vùng an toàn, thắng đúng tick hết giờ và rơi khỏi từng đảo.
- Quay video ngắn sau khi chạy thử giao diện trên máy thật.
