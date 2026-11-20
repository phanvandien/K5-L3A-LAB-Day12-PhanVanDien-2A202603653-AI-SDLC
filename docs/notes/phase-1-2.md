# Ghi chép Phase 1–2 (lịch sử trước Ticket-03)

## Quyết định và giả định

- Làm lõi mô phỏng headless trước phần hiển thị vì contract tự động là điều kiện chấm quan trọng nhất.
- Chọn Node.js thuần, không thêm dependency, để lệnh chạy ngắn và máy macOS/Linux không cần cài engine.
- Phase 2 là thay đổi chuẩn số liệu: các giá trị Phase 1 tùy chọn được thay bằng bảng chuẩn trong Ticket-02.
- Bản đồ và cảnh được tạo bằng tọa độ/procedural drawing; chưa dùng asset ngoài.

## Nhật ký dùng AI

| Phase | Công việc AI | Token/chi phí |
|---|---|---|
| 1–2 | Đọc PRD/contract, tạo simulation, CLI JSONL, UI, scenario và harness | Công cụ hội thoại hiện tại không cung cấp đồng hồ token/chi phí theo tác vụ; không tự ước lượng con số |

## Evaluation

- Contract: bộ kiểm chứng cục bộ chạy các scenario và regression được liệt kê trong `tools/verify.js`.
- AI đã có lỗi trong lần đầu: verifier đọc record `end` như snapshot cho Gió Lạc và pause. Chạy thật làm lộ lỗi; verifier được sửa để tìm snapshot theo tick.
- Lỗi trong thiết kế ban đầu: điểm được cộng cả lúc nhặt lẫn nạp mote. So với định nghĩa điểm Ticket-02, chỉ nạp mới cộng điểm; logic đã sửa và scenario lantern kiểm tra lại.
- Chưa kiểm tra tương tác trình duyệt, hình ảnh, âm thanh đầy đủ hoặc FPS. Không ghi các hạng mục đó là đạt.

## Retro

Tách simulation khỏi canvas giúp test headless nhanh và tất định. Lần sau nên thiết kế các scenario ranh giới ngay khi đọc ticket và dựng renderer 3D ở một phase riêng; Canvas 2.5D rút ngắn thời gian nhưng chưa đạt yêu cầu đồ họa 3D. Harness hiện có verifier dùng chung; nên bổ sung test cho các chuyển trạng thái và tương tác địa hình trước Phase 3.
