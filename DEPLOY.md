# Apple Worm production

Trong thư mục D:\VQD\apple-warm-main chạy:

    docker compose up -d --build

Mở http://localhost:18770/games/apple-worm để kiểm tra. Production dùng https://apple-worm.antfootage.net/games/apple-worm.
Domain chỉ hoạt động sau khi trỏ DNS A/AAAA về server và cấu hình HTTPS reverse proxy. Mẫu Caddy ở deploy/Caddyfile chạy trên host. Nếu dùng proxy trong Docker, đặt cùng Docker network và proxy tới game:8080 thay cho 127.0.0.1.

Routes:
- /games/apple-worm: landing page SEO có ảnh trên header, hướng dẫn, khung game và mã nhúng.
- /embed/apple-worm: game tràn khung, cho phép iframe từ các domain khác; noindex.
- /seo/apple-worm-og.jpg: ảnh chia sẻ 1200x630.
- /robots.txt, /sitemap.xml, /healthz.

Mã nhúng:

    <iframe src="https://apple-worm.antfootage.net/embed/apple-worm" title="Apple Worm" width="960" height="720" style="width:100%;aspect-ratio:4/3;height:auto;border:0" allow="autoplay;fullscreen;gamepad" allowfullscreen loading="lazy"></iframe>

Proxy/CDN phía trước không được thêm X-Frame-Options DENY/SAMEORIGIN hoặc CSP frame-ancestors 'self' cho route embed. CORS không cần để nhúng iframe. Trang cha có CSP phải cho phép https://apple-worm.antfootage.net trong frame-src.

SITE_URL là origin công khai cho canonical, Open Graph và sitemap; thay trong .env rồi docker compose up -d. Không đặt đường dẫn hoặc dấu / cuối. APP_PORT mặc định 18770, bind loopback cho reverse proxy. Đổi BIND_ADDRESS=0.0.0.0 nếu cần truy cập trực tiếp từ mạng.

Bản production là file tĩnh, không gọi Poki và không tải bù 404 từ Internet. Runtime hostname redirect được bỏ trong deploy/public/apple-worm/js/Main.js để chạy trên domain riêng; bản tải gốc vẫn ở www/js/Main.js. local-sdk.js thay SDK quảng cáo; rewarded ads không được cung cấp. Không thêm header Cross-Origin-Embedder-Policy yêu cầu CORP vì có thể ngăn nhúng chéo domain.

Webgame D:\ANT_1\web-game-public-main đã nối Apple Worm tới domain trên. Nó cũng chứa bản game local và route /embed/apple-worm nếu muốn deploy cùng domain; đặt NEXT_PUBLIC_APPLE_WORM_EMBED_URL=/embed/apple-worm khi build. SITE_URL của webgame phải là domain của webgame, tách với SITE_URL của game.

## Deploy HTTPS bằng Docker Caddy
Trên server đã trỏ DNS apple-worm.antfootage.net về đúng IP, mở cổng 80/443 rồi chạy:

    docker compose -f compose.yaml -f compose.production.yaml up -d --build

Caddy tự cấp/gia hạn HTTPS và proxy tới game:8080 trong cùng Docker network. Nếu server đã dùng Nginx Proxy Manager/Traefik/Caddy khác, chỉ chạy compose.yaml và cấu hình proxy hiện có tới cổng 18770; không chạy thêm Caddy chiếm cổng 80/443.

Kiểm tra sau deploy:

    curl -I https://apple-worm.antfootage.net/embed/apple-worm

Phải có Content-Security-Policy: frame-ancestors * và X-Robots-Tag: noindex, follow. Sau đó mở trang webgame và bấm Play now.