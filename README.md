# HomeLoan JP — tính vay mua nhà Nhật Bản

Công cụ tính khoản vay mua nhà theo phương thức **元利均等返済** (trả đều tổng gốc + lãi mỗi tháng). Chạy hoàn toàn trong trình duyệt, không cần đăng nhập hoặc backend.

## Tính năng

- **Khoản vay cơ bản:** số tiền vay từ trên 0 đến 20.000 man (万円); thanh kéo bước 10 man; lãi suất 0–100%/năm, bước kéo 0,01%; kỳ hạn 1–50 năm. Nhập trực tiếp hoặc kéo, tự đồng bộ.
- **Trả trước 繰上返済:** nhiều lần trả thêm vào cuối năm chọn; phương án giảm kỳ hạn (期間短縮型) hoặc giảm tiền trả tháng (返済額軽減型), hiển thị thời điểm tất toán và lãi tiết kiệm.
- **Lãi suất thay đổi 変動金利:** nhập nhiều mốc năm bắt đầu và mức lãi suất tương ứng; điều chỉnh lại khoản trả định kỳ và cập nhật dòng tiền. Khi đã rút ngắn kỳ hạn, việc đổi lãi suất không tự kéo khoản vay trở về kỳ hạn gốc.
- **Mua nhà:** nhập giá nhà, tiền tự có, chọn LTV 80/90/100%, phân tích vốn cần chuẩn bị và các chi phí (phí ngân hàng, môi giới, đăng ký, thuế, bảo hiểm, phí khác). Không áp phí mặc định nếu chưa xác nhận.
- **So sánh hai ngân hàng:** tùy chỉnh tên, lãi suất, phí theo man hoặc %, so sánh tổng chi phí; không lấy dữ liệu lãi suất thời gian thực.
- **Khả năng trả nợ:** thu nhập năm trước thuế, nợ khác, chi phí duy trì, tỷ lệ trả nợ (DTI), ngân sách tháng và số vay mô phỏng theo lãi suất stress test.
- **Trực quan:** biểu đồ gốc/lãi theo năm, bảng trả nợ theo năm, xuất CSV theo năm và theo tháng, sao chép kết quả, lưu cài đặt vào localStorage.
- **Responsive:** giao diện PC, tablet, iPhone/iPad; bảng và biểu đồ cuộn ngang; tự ẩn bàn phím iOS khi chạm ra ngoài ô nhập.

## Công thức

Với số dư nợ `P`, lãi suất tháng `r = lãi suất năm / 1200` và số tháng còn lại `n`:

`Khoản trả tháng = P × r / (1 - (1 + r)^(-n))`

Khi `r = 0`, khoản trả tháng bằng `P/n`. Mỗi tháng lãi = dư nợ đầu kỳ × lãi suất tháng. Khoản trả trước được khấu trừ gốc sau kỳ trả thông thường của tháng được chọn.

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

Mở `bank-rates.html` để xem lãi suất công bố và giải thích bằng tiếng Việt. Endpoint `/api/rates` (Vercel Serverless Function) đọc từ các trang ngân hàng chính thức, xác nhận số liệu trong HTML và phản hồi lỗi khi không thể lấy dữ liệu. Dữ liệu được cache khoảng 4 giờ và trang lưu lịch sử quan sát tại localStorage của chính thiết bị (không phải lịch sử server). Không có xác suất duyệt vay hoặc lãi suất cá nhân. Nút tính toán chuyển lãi suất *tối thiểu công bố* vào máy tính để mô phỏng; không có nghĩa người vay chắc chắn nhận mức giá đó.
