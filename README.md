# Đảo Đèn Lồng

Game phiêu lưu nhẹ theo ba đêm của Mây trên Đảo Bến, Đảo Cau và Đảo Chuông. Mây nhặt đom đóm, nạp vào đèn, tránh Bóng Mực và dùng Tỏa Sáng để làm chúng choáng.

## Chạy game

Cần Node.js 18 trở lên. Trên macOS/Linux:

```sh
npm install
npm start
```

Mở `http://127.0.0.1:4173`. Trên Windows PowerShell dùng `npm.cmd install` và `npm.cmd start` nếu chính sách PowerShell chặn `npm.ps1`. Game chạy cục bộ và không cần thư viện npm ngoài.

## Điều khiển

- `W A S D`: di chuyển; `Space`: nhảy; `Shift`: lướt.
- `E`: nạp đom đóm vào đèn gần nhất; `Q`: Tỏa Sáng.
- `Esc` hoặc `P`: tạm dừng. Giữ chuột phải và kéo để xoay hướng camera.
- Cài đặt lưu âm lượng, độ nhạy chuột và bảng màu dễ phân biệt trong trình duyệt.

Đèn sáng hao 1 dầu/giây. Dùng đom đóm để châm dầu; đèn hết dầu tắt và có thể thắp lại. Bóng Mực có thể hút dầu của đèn yếu. Mây phải giữ sáng ít nhất 60% số đèn đến bình minh. Điểm Phase 3: +5 mỗi đom đóm nạp, +100 lần thắp đầu, +40 lần thắp lại, +5 khi pulse trúng Bóng Mực (+15 nếu nó đang hút dầu); thắng cộng 50 + `floor(dầu)` mỗi đèn đang sáng và 50 mỗi Ngọn Lửa còn.

## Headless và kiểm chứng

`game.contract.json` khai báo Contract 1.2. Lõi mô phỏng chạy ở 60 tick/giây, không cần cửa sổ hay GPU; cùng seed, scenario và inputs cho JSONL giống nhau.

```sh
node src/headless.js --seed 42 --night 1 --ticks 600 --out out.jsonl
node tools/verify.js
```

CLI nhận `--seed`, `--night 1|2|3`, `--scenario file.json`, `--inputs file.json`, `--ticks`, `--snapshot-every` và `--out`. JSONL bắt đầu bằng snapshot tick 0, ghi event khi phát sinh, rồi kết thúc bằng record `end`. Scenario đầu vào và kiểm chứng nằm trong `tests/`; kết quả Phase 3 hiện tại ở [docs/proof/phase-1-3-verification.json](docs/proof/phase-1-3-verification.json).

## Tài liệu dự án

- [Tiêu chí nghiệm thu và phạm vi Phase 1–3](docs/spec/phase-1-3.md)
- [Giả định, nhật ký AI và retrospective](docs/notes/phase-1-3.md)
- [Quyết định thiết kế nhiên liệu và bình minh](docs/notes/ADR-003-fuel-and-dawn.md)
- [Changelog thay đổi Phase 3](CHANGELOG.md)
- [Bằng chứng và giới hạn kiểm chứng](docs/proof/phase-1-3-verification.md)
- [Harness agent](AGENTS.md)
- [Nguồn asset](CREDITS.md)

## Sáng tạo của tôi

Giao diện và hình ảnh được vẽ bằng Canvas 2D tự tạo, không dùng mô hình hoặc hình ảnh bên ngoài. Mây có đèn nhỏ, đom đóm có quầng sáng, đèn có thanh dầu và Bóng Mực hút dầu khi đèn yếu. Có cài đặt bảng màu dễ phân biệt. Đây là hình chiếu 2.5D; renderer 3D đầy đủ vẫn chưa đạt.

## Trạng thái bàn giao

Mã nguồn Phase 1–3 và scenario được cập nhật. Bộ kiểm chứng headless có test regression Phase 1–2 cùng scenario Phase 3. Các giới hạn còn lại và mục chưa được xác nhận bằng cách chơi giao diện thật được ghi rõ trong spec và bằng chứng. Chưa có video demo, tag Git hay Release được tạo trong workspace này.
