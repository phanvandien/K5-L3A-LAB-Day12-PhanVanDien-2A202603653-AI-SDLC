# Changelog

## 1.2.0 — Phase 3 “Đèn cạn dầu”

Breaking changes from Contract 1.1:

- Đèn đang sáng có nhiên liệu, hao dầu mỗi tick, có thể bị Bóng Mực hút cạn, tắt và thắp lại.
- Điều kiện thắng chuyển từ thắp mọi đèn sang giữ sáng ít nhất 60% số đèn tới bình minh; không còn thắng sớm khi thắp đủ.
- Thời lượng Đêm đổi thành 240/270/300 giây.
- Công thức điểm đổi; bỏ thưởng thời gian.
- Sức chứa đom đóm tăng theo số lần thắp thành công trong đêm, tối đa 20.
- Contract đổi từ 1.1 lên 1.2; snapshot, scenario và event bổ sung trường fuel/drain/relight.
- Thêm tùy chọn bảng màu dễ phân biệt và lưu giữa các lần mở game.

Các yêu cầu Phase 1–2 không bị thay thế vẫn nằm trong regression suite.
