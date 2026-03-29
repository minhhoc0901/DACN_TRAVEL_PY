# 🌍 Travel & Tour E-Commerce Ecosystem (Fullstack Project)

Dự án **Travel & Tour Management System** là một nền tảng thương mại điện tử du lịch toàn diện, được xây dựng với mục tiêu giải quyết các bài toán thực tế của ngành lữ hành. Dự án tích hợp **Trí tuệ nhân tạo (AI)**, hệ thống **Fintech riêng biệt (Ví điện tử)** và mô hình **Kinh tế đóng góp (UGC)**.

---

## 🚀 Điểm Sáng Chiến Lược (Strategic Highlights)

- **Hệ sinh thái Fintech nội bộ**: Tự xây dựng logic Ví điện tử (Wallet), xử lý nạp/rút và tranh chấp tiền tệ với cơ chế Row-level locking trong MySQL.
- **Trí tuệ nhân tạo (Generative AI)**: Tích hợp Google Gemini AI để tự động hóa quy trình tư vấn và hỗ trợ khách hàng 24/7.
- **Mô hình Marketplace (UGC)**: Hệ thống cho phép người dùng đăng tải nội dung (Tour) và quy trình Admin phê duyệt chặt chẽ, mở rộng quy mô kinh doanh không giới hạn.

---

## 📊 Bảng Tổng Hợp Chi Tiết Tính Năng

| Module | Tính Năng & Chi Tiết Kỹ Thuật | Điểm Nhấn (Tech Highlight) |
| :--- | :--- | :--- |
| **Hệ thống Ví (Credit)** | Nạp tiền, Thanh toán nội bộ, Yêu cầu rút tiền, Lịch sử giao dịch chi tiết. | Chống lỗi tranh chấp (Race Condition) bằng `FOR UPDATE` trong Transaction. |
| **Đặt chỗ (Booking)** | Quy trình đặt tour đa bước, Quản lý tồn kho chỗ trống (Slots) theo thời gian thực. | Tự động hoàn trả slots khi đơn hàng quá hạn thanh toán (Cron Jobs). |
| **Hoàn trả (Refund)** | Chính sách hoàn tiền thông minh (Smart Refund) dựa trên thời gian hủy thực tế (Phần trăm hoàn phí tự động). | Quy trình Admin phê duyệt rút tiền và hoàn tiền đa tầng. |
| **AI Support** | Chatbot tư vấn hành trình cá nhân hóa sử dụng Google Gemini AI SDK. | Xử lý ngôn ngữ tự nhiên, phản hồi thông tin địa điểm chính xác. |
| **Hòa đơn & QR** | Xuất hóa đơn PDF chuyên nghiệp, Tích hợp QR Code để xác thực tính hợp lệ của đơn hàng. | Sử dụng `PDFKit` và `QRCode` để số hóa quy trình quản lý hóa đơn. |
| **Real-time** | Chat trực tiếp Admin-User, Thông báo đẩy (Push Notifications) về trạng thái booking/duyệt bài. | Kiến trúc hướng sự kiện (Event-driven) trên `Socket.IO`. |
| **Cộng tác viên** | User tạo Tour mới (trạng thái Pending), Admin duyệt bài (Approve/Reject) và quản lý nội dung. | Hệ thống quản lý trạng thái bài đăng (State Pattern) hiệu quả. |
| **Quản trị (Admin)** | Dashboard BI sâu: Thống kê doanh thu 12 tháng, Top Tour, Quản lý tài chính và người dùng. | Biểu đồ trực quan với `Chart.js` và quản lý lọc dữ liệu nâng cao. |

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Backend (Micro-monolith Architecture)
- **Engine**: Node.js & Express Framework.
- **Database**: MySQL với Sequelize ORM (Đảm bảo tính toàn vẹn dữ liệu qua Database Transactions).
- **Core Libraries**: `Socket.IO` (Real-time), `Node-cron` (Automation), `PDFKit` (Invoicing), `VNPAY SDK` (Payment).
- **AI Integration**: `@google/generative-ai` (Gemini SDK).
- **Security**: JWT Authentication, Bcrypt Password Hashing, Joi Schema Validation.

### Frontend (Component-based UI)
- **Core**: React 19 (Latest Version), React Router Dom v7.
- **Themes & UI**: Material UI (MUI), Bootstrap 5, Framer Motion (Animations), AOS (Scroll Animation).
- **Interactive**: Leaflet (Maps Integration), React-chartjs-2 (Business Statistics).
- **State Management**: React Hooks & Context API.

---

## 📁 Cấu Trúc Dự Án (Architecture)

```bash
├── backend/                # Server-side logic
│   ├── config/             # Cấu hình môi trường & Database
│   ├── controllers/        # Xử lý Logic nghiệp vụ (Booking, AI, Credit, v.v.)
│   ├── models/             # Định nghĩa Schema & Relationships (MySQL)
│   ├── routes/             # API Endpoints (Auth, Tours, Payments, v.v.)
│   └── utils/              # Third-party Services (Mail, AI, PDF, QR...)
├── frontend/               # Client-side (React)
│   ├── src/pages/          # Dynamic Page Routing (Admin & User)
│   ├── src/components/     # Modular UI & Reusable Components
│   └── src/services/       # API Integration Layer
└── README.md
```

---

## 🛡️ Điểm Nhấn Kỹ Thuật (Technical Excellence)

1. **Hiệu năng & Tối ưu**: Kết hợp Cache Service và tối ưu câu lệnh SQL (Indexing) để xử lý lượng dữ liệu tour lớn.
2. **Bảo mật**: Validate dữ liệu chặt chẽ cả 2 đầu (Frontend & Backend), tích hợp Metadata Sanitize chống tấn công XSS.
3. **UX Responsive**: Giao diện hiển thị hoàn hảo trên mọi thiết bị (Mobile, Tablet, Desktop) với hệ thống Layout linh hoạt.
4. **Tự động hóa**: Hệ thống Cron Jobs vận hành ngầm để quản lý trạng thái đơn hàng và các chiến dịch khuyến mãi.

---

## ⚙️ Hướng Dẫn Cài Đặt

### 1. Yêu cầu
- Node.js >= 18.x
- MySQL Server

### 2. Cài đặt chi tiết
- Tham khảo hướng dẫn trong thư mục `backend` và `frontend` để cấu hình biến môi trường (`.env`) và khởi chạy dự án.

---
*Dự án được hoàn thiện với sự chú trọng cao vào hiệu năng, bảo mật và trải nghiệm người dùng thực tế.*