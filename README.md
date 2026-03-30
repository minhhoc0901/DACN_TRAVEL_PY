# 🌍 Travel & Tour E-Commerce Ecosystem (Fullstack Project)

Dự án **Travel & Tour Management System** là một nền tảng thương mại điện tử du lịch toàn diện, được xây dựng với mục tiêu giải quyết các bài toán thực tế của ngành lữ hành. Dự án tích hợp **Trí tuệ nhân tạo (AI)**, hệ thống **Fintech (Ví điện tử)** và mô hình ** Marketplace (UGC)**.

---

## 🚀 Điểm Sáng Chiến Lược (Strategic Highlights)

- **Hệ sinh thái Fintech nội bộ**: Tự xây dựng logic Ví điện tử (Wallet), xử lý nạp/rút và tranh chấp tiền tệ với cơ chế Row-level locking trong MySQL.
- **Trí tuệ nhân tạo (Generative AI)**: Tích hợp Google Gemini AI để tự động hóa quy trình tư vấn và hỗ trợ khách hàng 24/7.
- **Mô hình Marketplace (UGC)**: Hệ thống cho phép người dùng đăng tải nội dung (Tour) và quy trình Admin phê duyệt chặt chẽ, mở rộng quy mô kinh doanh không giới hạn.
- **Hạ tầng Media Hiện đại**: Tích hợp **Cloudinary** để quản lý, tối ưu hóa và phục vụ hình ảnh tốc độ cao, đảm bảo trải nghiệm thị giác mượt mà.

---

## 📊 Bảng Tổng Hợp Chi Tiết Tính Năng

| Module | Tính Năng & Chi Tiết Kỹ Thuật | Điểm Nhấn (Tech Highlight) |
| :--- | :--- | :--- |
| **Hệ thống Ví (Credit)** | Nạp tiền, Thanh toán nội bộ, Yêu cầu rút tiền, Lịch sử giao dịch chi tiết. | Chống lỗi tranh chấp (Race Condition) bằng `FOR UPDATE` trong Transaction. |
| **Đặt chỗ (Booking)** | Quy trình đặt tour đa bước, Quản lý tồn kho chỗ trống (Slots) theo thời gian thực. | Tự động hoàn trả slots khi đơn hàng quá hạn thanh toán (Cron Jobs). |
| **Hoàn trả (Refund)** | Chính sách hoàn tiền thông minh dựa trên thời gian hủy thực tế. | Quy trình Admin phê duyệt rút tiền và hoàn tiền đa tầng. |
| **AI Support** | Chatbot tư vấn hành trình cá nhân hóa sử dụng Google Gemini AI SDK. | Xử lý ngôn ngữ tự nhiên, phản hồi thông tin trực quan. |
| **Quản trị Media** | Upload/Sửa/Xóa ảnh đồng bộ giữa Database và Cloud Storage. | **Image Sync Pattern**: Tự động dọn dẹp ảnh cũ khi cập nhật hoặc xóa dữ liệu. |
| **Real-time** | Chat trực tiếp Admin-User, Thông báo đẩy (Push Notifications). | Kiến trúc hướng sự kiện (Event-driven) trên `Socket.IO`. |
| **Quản trị (Admin)** | Dashboard BI sâu: Thống kê doanh thu, Quản lý địa điểm và Tour chuyên nghiệp. | Hệ thống Toast Notification và Modal tinh chỉnh cho UX tối ưu. |

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Backend (Micro-monolith Architecture)
- **Engine**: Node.js & Express Framework.
- **Database**: MySQL với Sequelize ORM (Đảm bảo tính toàn vẹn qua Database Transactions).
- **Media Cloud**: **Cloudinary SDK** (Quản lý và CDN lưu trữ hình ảnh).
- **Core Libraries**: `Socket.IO` (Real-time), `Node-cron` (Automation), `PDFKit` (Invoicing), `VNPAY SDK`.
- **AI Integration**: `@google/generative-ai` (Gemini SDK).

### Frontend (Component-based UI)
- **Core**: React 19 (Latest Version), React Router Dom v7.
- **Themes & UI**: Material UI (MUI), Bootstrap 5, Framer Motion (Animations), AOS.
- **Interactive**: Leaflet (Maps Integration), React-chartjs-2 (Analytics).
- **Notifications**: `React-Toastify` (Global Notification System).

---

## 🛡️ Điểm Nhấn Kỹ Thuật (Technical Excellence)

1. **Image Synchronization Pattern**: Giải quyết triệt để vấn đề mất ảnh hoặc trùng lặp ảnh trong cơ sở dữ liệu quan hệ (Location, Tours) bằng logic Sync DB-Cloud chặt chẽ.
2. **Hiệu năng & Tối ưu**: Sử dụng Cloudinary CDN và tối ưu SQL Indexing để xử lý dữ liệu quy mô lớn.
3. **Bảo mật**: Validate dữ liệu 2 đầu (Frontend/Backend), cấu hình bảo mật môi trường (`.env`) chuẩn hóa.
4. **UX Premium**: Thiết kế Responsive hiện đại, hệ thống thông báo tức thì (Real-time Toasts) và các micro-interaction cao cấp.

---

## ⚙️ Hướng Dẫn Cài Đặt

### 1. Yêu cầu
- Node.js >= 18.x
- MySQL Server

### 2. Cài đặt chi tiết
- Tham khảo hướng dẫn trong thư mục `backend` và `frontend` để cấu hình biến môi trường (`.env`) và khởi chạy dự án.

---
*Dự án được hoàn thiện với sự chú trọng cao vào hiệu năng, bảo mật và trải nghiệm người dùng thực tế.*
