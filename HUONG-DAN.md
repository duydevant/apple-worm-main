# Apple Worm - local

Chạy START.cmd rồi mở http://localhost:18766/ . Dừng bằng STOP.cmd.
Dùng đúng localhost: runtime gốc chuyển hướng nếu mở bằng IP 127.0.0.1.
Cần Node.js và curl.exe trên PATH; nginx đã có trong runtime/.

## Cách tải
1. curl tải HTML https://poki.com/en/g/apple-worm (poki-page.html).
2. Đọc iframe và tải với Referer https://poki.com/ (game-original.html).
3. HTML game gốc lưu index-original.html; bản chạy nằm trong www/index.html.
4. nginx phục vụ www/. Nếu thiếu file, error_page 404 chuyển sang helper Node cổng 18767.
5. Helper gọi curl.exe tải từ bản game CDN, lưu đúng đường dẫn trong www/, rồi trả nội dung. Các lượt sau nginx phục vụ trực tiếp từ đĩa.

Nguồn game: https://9212eedf-92d3-409f-9469-a6f67a2d1870.gdn.poki.com/b2e08cba-a56c-44ae-900f-58c7f6f2f63b/

## Các điều chỉnh cục bộ
www/index.html dùng local-sdk.js thay SDK mạng của Poki để chạy không phụ thuộc quảng cáo/tracking. Adapter không cung cấp quảng cáo thưởng. SDK đã tải được giữ trong www/__remote/. Runtime js/Main.js, loader và SWF không sửa.

## Kiểm chứng
Đã vào menu, chọn level 1 và nhấn ArrowRight khi trình duyệt chặn mọi request ngoài localhost. Không có lỗi JavaScript, HTTP lỗi hay request ngoài máy trong lần kiểm tra cuối. Chưa kiểm tra toàn bộ màn chơi.
Xem logs/verification.json và level-1-after-move.png.
Log tải: logs/downloads.jsonl (nginx-404 và URL/status/kích thước file).
Log nginx: logs/access.log, logs/nginx-error.log.
Lần đầu có favicon.ico 404 vì CDN không có file này; HTML cục bộ đã dùng icon data: để không request lại.

Các file đã lưu có thể phục vụ không cần mạng. Nếu phát sinh tài nguyên mới chưa tải, helper cần mạng để bổ sung.