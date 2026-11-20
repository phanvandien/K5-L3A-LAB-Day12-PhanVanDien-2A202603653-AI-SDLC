# Bằng chứng kiểm chứng Phase 1–2

Chạy bằng Node.js `node tools/verify.js`. Lệnh ghi stdout thật vào `phase-1-2-verification.json`, cùng thời điểm, phiên bản Node và thời gian full-night đo được. Bộ kiểm tra bao gồm 12 mục: determinism; pickup/deposit; dash; hai bục nhảy; pulse; shade hit; charm; Wind Drifter; pause; map/time/wind; format scenario Phase 1; và full-night 21.600 tick.

Smoke run của server cục bộ: `GET /` và `GET /src/app.js` đều trả HTTP 200. Điều này chỉ xác nhận server phân phối được trang và script; không thay cho kiểm tra chơi bằng mắt.

Kết quả chỉ chứng minh các điều kiện được nêu trong suite. Nó không chứng minh test ẩn của giảng viên, hình ảnh giao diện, renderer 3D, âm thanh đầy đủ hoặc FPS. Bằng chứng này khớp với source hiện tại trong workspace; chưa gắn vào tag `phase-1`/`phase-2`.
