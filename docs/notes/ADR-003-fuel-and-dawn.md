# ADR-003: Nhiên liệu và điều kiện thắng tới bình minh

- **Trạng thái:** Chấp nhận
- **Ngày:** 2026-11-20
- **Bối cảnh:** Ticket-03 thay đổi luật để tránh kết thúc sớm sau khi thắp đủ đèn. Đèn có thể tắt, Bóng Mực hút dầu và người chơi phải giữ đủ đèn đến bình minh.

## Quyết định

1. Mỗi đèn lưu `fuelTicks` nguyên, với 60 tick tương đương một đơn vị dầu. Mức tối đa 100 tương ứng 6000 tick dầu. Hao hụt nền trừ 1 đơn vị nội bộ mỗi tick; Bóng Mực drain trừ thêm 5.
2. `lit` phản ánh đèn có dầu hay không; `ever_lit` tồn tại qua lúc tắt. Lần thắp đầu cần 10 đom đóm; thắp lại cần 5. Tiến độ nạp lúc đèn tắt được giữ trong `deposited`, nhưng đèn chỉ nhận trạng thái sáng và 100 dầu khi đủ chi phí của lần đó.
3. Khi đèn tắt, `fuelTicks=0`, `deposited=0`, `ever_lit` vẫn giữ nguyên; phát `lantern_out`.
4. Chỉ kiểm tra thắng/thua tại cuối tick bình minh. Cạn Ngọn Lửa được ưu tiên và luôn thua. Nếu còn sống, so số đèn sáng với `ceil(0.6 × tổng đèn)`.
5. Sức chứa là `min(20, 10 + 2 × successful_lights)`. Đèn được đánh dấu sáng sẵn trong scenario không làm tăng bộ đếm.
6. Điểm ghi trực tiếp theo từng sự kiện. Thưởng bình minh tính từ nhiên liệu và số lửa còn; không thưởng theo thời gian.

## Hệ quả

- Contract 1.1 và mọi test kỳ vọng kết thúc ngay khi tất cả đèn sáng bị thay thế. Không bỏ test âm thầm: test tương ứng được thay bằng test “chưa thắng trước bình minh” và test kiểm tra ngưỡng ở tick cuối.
- Mảng mote tọa độ Phase 1 và các tính năng Ticket-02 không bị thay thế vẫn được giữ.
- Dùng số nguyên nội bộ tránh sai số nổi khi trừ dầu 1/60 qua hàng chục nghìn tick.

## Chưa giải quyết

Mô phỏng vật cản địa hình và các vị trí shade trên nhiều tầng vẫn giản lược; cần scenario riêng khi hoàn thiện renderer/bản đồ.
