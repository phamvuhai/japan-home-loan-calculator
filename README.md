# Tính vay mua nhà Nhật Bản

Ứng dụng HTML đơn (không cần cài đặt thư viện, không có máy chủ) để tính khoản vay mua nhà ở Nhật.

- Chỉnh sửa **số tiền vay** theo **万円 (man)**, **lãi suất %/năm** và **thời hạn vay năm** bằng cả **ô nhập số lẫn thanh kéo**; hai cách nhập luôn đồng bộ. Thanh kéo tự mở rộng phạm vi khi nhập giá trị lớn hơn mức mặc định.
- Tự tính khoản trả hằng tháng (元利均等返済), tổng gốc + lãi và tổng lãi.
- Bảng trả nợ từng năm, tải CSV, sao chép kết quả; giao diện dùng tốt trên điện thoại.
- Biểu đồ hai cột gốc/lãi theo từng năm ngay dưới kết quả tính toán; chọn năm để xem số tiền chính xác (¥). Biểu đồ tự cập nhật khi thay đổi khoản vay và cuộn ngang được trên điện thoại.
- Ghi nhớ thông số trong trình duyệt. Không gửi dữ liệu cho bên thứ ba.

## Giao diện responsive

- **PC (trên 1050px):** hai cột thiết lập khoản vay và kết quả, biểu đồ.
- **Tablet (641–1050px):** bố cục một cột, ô nhập chia hàng hợp lý, có tóm tắt tiền trả hằng tháng.
- **Điện thoại (đến 640px):** vùng chạm lớn, thanh kéo dễ sử dụng, thẻ kết quả hằng tháng nổi khi đang nhập thông số.
- Biểu đồ hỗ trợ chọn năm, chạm vào cột và vuốt ngang. Bảng trả nợ có cột Năm cố định khi cuộn ngang.
- Không dùng framework, thư viện CDN hay máy chủ; chỉ có `index.html`.

## Sử dụng

Mở `index.html` trên trình duyệt. Ví dụ 3.400 man, 5%/năm, 35 năm:

- Hằng tháng: khoảng 171.594 ¥
- Tổng lãi: khoảng 38.069.400 ¥
- Tổng gốc + lãi: khoảng 72.069.400 ¥

## Xuất bản trên GitHub Pages

1. Đưa `index.html` vào gốc repository public.
2. Vào **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Chọn nhánh chứa `index.html`, thư mục **/(root)**, bấm **Save**.
4. Truy cập URL GitHub Pages do GitHub hiển thị.

Lưu ý: phép tính giả định lãi suất không đổi suốt kỳ vay, không tính phí phát sinh và có thể chênh vài yen do quy tắc làm tròn của ngân hàng.