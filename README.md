# HomeLoan JP — tính vay mua nhà Nhật Bản

Công cụ tính khoản vay mua nhà theo phương thức **元利均等返済** (trả đều tổng gốc + lãi mỗi tháng). Máy tính chạy trong trình duyệt và không cần đăng nhập. Trang theo dõi lãi suất đọc dữ liệu do GitHub Actions thu thập theo lịch.

## Tính năng

- **Khoản vay cơ bản:** số tiền vay từ trên 0 đến 20.000 man (万円); thanh kéo bước 10 man; lãi suất 0–100%/năm, bước kéo 0,01%; kỳ hạn 1–50 năm. Nhập trực tiếp hoặc kéo, tự đồng bộ.
- **Trả trước 繰上返済:** nhiều lần trả thêm vào cuối năm chọn; phương án giảm kỳ hạn (期間短縮型) hoặc giảm tiền trả tháng (返済額軽減型), hiển thị thời điểm tất toán và lãi tiết kiệm.
- **Lãi suất thay đổi 変動金利:** nhập nhiều mốc năm bắt đầu và mức lãi suất tương ứng; điều chỉnh lại khoản trả định kỳ và cập nhật dòng tiền. Khi đã rút ngắn kỳ hạn, việc đổi lãi suất không tự kéo khoản vay trở về kỳ hạn gốc.
- **Mua nhà:** nhập giá nhà, tiền tự có, chọn LTV 80/90/100%, phân tích vốn cần chuẩn bị và các chi phí (phí ngân hàng, môi giới, đăng ký, thuế, bảo hiểm, phí khác). Không áp phí mặc định nếu chưa xác nhận.
- **So sánh ngân hàng:** có thể nhập hai phương án thủ công; trang bank-rates.html dùng dữ liệu ngân hàng công bố đã được thu thập theo lịch.
- **Khả năng trả nợ:** thu nhập năm trước thuế, nợ khác, chi phí duy trì, tỷ lệ trả nợ (DTI), ngân sách tháng và số vay mô phỏng theo lãi suất stress test.
- **Trực quan:** biểu đồ gốc/lãi theo năm, bảng trả nợ theo năm, xuất CSV theo năm và theo tháng, sao chép kết quả, lưu cài đặt vào localStorage.
- **Responsive:** giao diện PC, tablet, iPhone/iPad; bảng và biểu đồ cuộn ngang; tự ẩn bàn phím iOS khi chạm ra ngoài ô nhập.

## Công thức

Với số dư nợ `P`, lãi suất tháng `r = lãi suất năm / 1200` và số tháng còn lại `n`:

`Khoản trả tháng = P × r / (1 - (1 + r)^(-n))`

Khi `r = 0`, khoản trả tháng bằng `P/n`. Mỗi tháng lãi = dư nợ đầu kỳ × lãi suất tháng. Khoản trả trước được khấu trừ gốc sau kỳ trả thông thường của tháng được chọn.

## Giao diện HomeLoan JP v4

- **PC (trên 1100px):** bảng điều khiển hai cột, khu vực nhập bên trái và kết quả bên phải; bảng kết quả chính dễ theo dõi khi cuộn.
- **Tablet (641–1100px):** luồng nhập một cột, các thông số có thể chia 2 cột, bản xem nhanh khoản thanh toán xuất hiện ngay trước biểu mẫu.
- **Mobile (đến 640px):** ưu tiên 1 cột, thanh kéo dễ chạm, các nút tối thiểu 40–44px, thanh hiển thị khoản trả tháng không che bàn phím đang mở.
- **Thứ tự nghiệp vụ:** giá nhà và vốn tự có → tiền vay/lãi suất/kỳ hạn → trả trước khoản vay (繰上返済) → thay đổi lãi suất (変動金利) → kết quả → chi phí mua nhà / ngân hàng / khả năng trả nợ.
- **Thu gọn hợp lý:** trả trước được làm nổi bật (tự thu gọn trên mobile nếu chưa có lần trả trước); các phân tích chuyên sâu đóng mặc định và có thể mở theo nhu cầu.
- **Phòng tránh lỗi khởi tạo:** trang, các module JavaScript và ID vùng kết quả có kiểm tra tính nhất quán, phiên bản tài nguyên JavaScript được đồng bộ.

## Chạy thử và kiểm thử

Mở `index.html` trực tiếp trong trình duyệt hoặc phục vụ bằng một máy chủ HTTP tĩnh.

Chạy kiểm thử lõi bằng Node.js 18+:

```bash
node --test tests/loan-core.test.js
```

Ứng dụng không có bước build và không yêu cầu package bên ngoài. Khi triển khai, phải xuất bản **index.html**, **calculator-core.js**, **advanced.js** cùng thư mục.

## Giới hạn và lưu ý quan trọng

Đây là **mô phỏng tài chính**, không phải kết quả phê duyệt vay. Lãi suất và phí ngân hàng do người dùng tự nhập và không được mô tả là điều kiện hiện tại của SMBC hay Suruga. Không tự áp dụng quy tắc 5 năm/125% đối với biến động lãi, hay phí trả nợ trước hạn. Có thể chênh vài yen do phương pháp làm tròn của ngân hàng. Phí duy trì hằng tháng được hiển thị riêng, chưa cộng vào tổng gốc/lãi và chi phí ban đầu. Phí môi giới chỉ là phép tính tham khảo theo giả định đã ghi.

Các giá trị đã nhập được lưu trong trình duyệt của chính thiết bị, không gửi đến máy chủ của ứng dụng.

## Theo dõi lãi suất SMBC / Suruga

Dữ liệu ngân hàng được kiểm tra hai lần mỗi ngày: **08:30 và 20:30 JST**, qua workflow .github/workflows/rate-sync.yml. GitHub Actions hỗ trợ timezone Asia/Tokyo; lịch có thể chạy trễ. Khi người dùng mở website, ứng dụng chỉ đọc bản dữ liệu đã lưu, KHÔNG gọi website ngân hàng.

- Parser: lib/bank-source.js, chỉ dùng các trang chính thức đã cho phép, kiểm tra ngày hiệu lực và dải lãi suất.
- Collector: scripts/sync-rates.js chống trùng trong mỗi ô lịch, lưu log thành công/thất bại và không thay thế bản đã xác minh khi truy cập ngân hàng lỗi.
- Kho dữ liệu chung trong repository: data/latest.json, data/history.json, data/fetch-logs.json. Đây là JSON có phiên bản, không phải PostgreSQL. Tài khoản Supabase liên kết hiện chỉ có database của một ứng dụng khác, nên không sử dụng.
- API Vercel /api/rates chỉ đọc bản JSON từ GitHub raw, cache khoảng 15 phút. Giao diện GitHub Pages đọc JSON từ GitHub raw với bản static dự phòng.
- Phần dịch tiếng Việt gồm tên gói, mô tả và thuật ngữ tài chính đã chuẩn hóa. Nội dung hợp đồng đầy đủ vẫn phải kiểm tra qua liên kết tiếng Nhật chính thức.
- Hồ sơ người vay lưu ở localStorage thiết bị, không gửi thông tin visa hoặc thu nhập lên máy chủ.

Chạy tests: node --test tests/*.test.js. GitHub Actions kiểm tra syntax và tests khi có push lên main.

Workflow production qua GitHub Pages: .github/workflows/deploy-pages.yml. Nếu Pages chưa bật, chủ repository cần vào Settings > Pages > Source: GitHub Actions một lần. Vercel yêu cầu tài khoản đang kết nối có quyền đối với chính project HomeLoan, không thể dùng project của ứng dụng khác.

Lãi suất công bố không phải đề nghị lãi suất cá nhân. Gói cố định 10 năm không được giả định cố định trọn 35 năm. Phí chưa xác minh không được tự coi là miễn phí. Repo công khai có thể tự tắt scheduled workflows sau 60 ngày không có hoạt động.
