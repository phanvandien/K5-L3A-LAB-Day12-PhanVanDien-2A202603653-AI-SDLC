# Ghi chép Phase 1–3

## Quyết định khi nhận Ticket-03

Ticket-03 thay cấu trúc điều kiện thắng và thêm fuel liên tục. Xem [ADR-003](ADR-003-fuel-and-dawn.md). Thời lượng và công thức điểm cập nhật theo contract mới; không giữ test thắng sớm `all_lit` vì ticket đã thay thế luật đó.

## Nhật ký dùng AI

| Phase | Công việc AI | Token/chi phí |
|---|---|---|
| 1–2 | Xây simulation, CLI, giao diện và harness | Không có số token/chi phí theo tác vụ trong công cụ; không tự ghi số ước lượng |
| 3 | Chuyển sang fuel integer-tick, hút dầu, relight, dawn win, capacity, colorblind và cập nhật scenario | Không có số token/chi phí theo tác vụ trong công cụ |

## Evaluation và thay đổi test

- Tách fuel thành đơn vị 1/60 để hao nền và drain có kết quả tất định.
- Các test từng kỳ vọng 10 điểm/mote, thưởng thời gian, thời lượng Phase 2 hoặc kết thúc khi đèn sáng hết không còn hợp lệ theo Ticket-03; suite thay bằng kiểm tra điểm mới, duration mới và thắng tại bình minh.
- Lần chạy đầu sau đổi luật còn yêu cầu end record ở 21.600 tick. Contract Phase 3 chỉ cần Đêm 3 18.000 tick; suite được cập nhật, không bỏ qua test.
- Bộ kiểm chứng hiện chạy scenario cho relight, châm dầu, tắt đèn, drain mỗi60 tick, pulse khi drain, sức chứa, ngưỡng và điểm bình minh, cùng regression các phase trước.
- Chưa chạy visual QA trong browser hoặc đo FPS; kết quả headless không chứng minh các mục đó.

## Retrospective

Mô hình integer-tick làm thay đổi fuel dễ kiểm tra hơn. Scenario giữ nguyên input cũ và thêm trường mới giúp tránh làm hỏng phase trước. Thiếu scenario riêng từ đầu cho bản đồ nhiều tầng và vật cản; phần địa hình vẫn đơn giản. Bước tiếp theo nên ưu tiên test vùng an toàn tại fuel=30, simultaneous drain, thua đúng tick bình minh, điều khiển trình duyệt và đo hiệu năng giao diện.
