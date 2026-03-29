const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fileUpload = require('express-fileupload');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const cron = require('node-cron');
const Booking = require('./models/Booking');

// Cấu hình dotenv
dotenv.config();

// --- Import Routes ---
const locationRoutes = require('./routes/locationRoutes');
const tourRoutes = require('./routes/tourRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const authRoutes = require('./routes/autRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRouter = require('./routes/adminRouter');
const contactRoutes = require('./routes/contactRoutes');
const chatRoutes = require('./routes/chatRoutes');
const chatWithAdminRouter = require('./routes/chatWithAdminRouter');
const notificationRoutes = require('./routes/notificationRoutes');
const adminNotificationRoutes = require('./routes/adminNotificationRoutes'); 
const promotionRoutes = require('./routes/promotionRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const tourPriceRoutes = require('./routes/tourPriceRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');
const tourDepartureRoutes = require('./routes/tourDepartureRoutes');
const locationCommentRoutes = require('./routes/locationCommentRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const creditRoutes = require('./routes/creditRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const Promotion = require('./models/Promotions');
const refundRoutes = require('./routes/refundRoutes');
const { checkConnection } = require('./config/db');

// --- Khởi tạo Express App và HTTP Server ---
const app = express();
const server = http.createServer(app);

// --- Cấu hình CORS tập trung ---
// Định nghĩa các origin được phép để sử dụng chung cho cả Express và Socket.IO
const allowedOrigins = [
    "http://localhost:3000",      // Web React
    "http://10.0.2.2:3000",      // Web trên Android emulator (nếu dùng)
];

const corsOptions = {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"], // Thêm các method khác nếu cần
    credentials: true
};

// --- Middlewares ---
app.use(cors(corsOptions)); // Áp dụng cấu hình CORS cho Express
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}));


// --- Serve Static Files (như hình ảnh uploads) ---
// Tạo thư mục uploads nếu chưa tồn tại
const uploadDirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/tours'),
    path.join(__dirname, 'uploads/locations'),
    path.join(__dirname, 'uploads/users'),
    path.join(__dirname, 'uploads/review_images'),
    path.join(__dirname, 'uploads/chat_admin_images')

];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Cấu hình Routes ---
app.get('/', (req, res) => {
    res.send('Welcome to the Travel API!');
});
app.use('/api/locations', locationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRouter);
app.use('/api/contact', contactRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chatwithadmin', chatWithAdminRouter);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tour-prices', tourPriceRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/tour-departures', tourDepartureRoutes);
app.use('/api/location-comments', locationCommentRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/refunds', refundRoutes);
// --- Cấu hình Socket.IO ---
const io = socketIo(server, {
    cors: corsOptions // Sử dụng lại cấu hình CORS đã định nghĩa ở trên
});

// LƯU SOCKET.IO INSTANCE VÀO APP ĐỂ CONTROLLERS CÓ THỂ TRUY CẬP

// Lưu instance với tên 'io' để dùng trong tourController và reviewController
app.set('io', io);
console.log('[Socket.IO] Instance saved to app as "io"');

// Gắn các handler cho Socket.IO
const setupChatSocket = require('./socket/chatSocket');
setupChatSocket(io);

const setupChatSocketWithAdmin = require('./socket/chatSocketWithAdmin');
setupChatSocketWithAdmin(io);

// --- Cấu hình Cron Job ---
/**
 * CRON JOB 1: Hủy booking quá hạn (MỖI PHÚT)
 */
cron.schedule('* * * * *', async () => {
    console.log('[CRON] Running job to cancel expired bookings...');
    try {
        const count = await Booking.cancelExpiredBookings(io); // ✅ TRUYỀN io
        if (count > 0) {
            console.log(`[CRON] Cancelled ${count} expired bookings.`);
        }
    } catch (error) {
        console.error('[CRON] Error in cancelExpiredBookings:', error);
    }
});

/**
 * CRON JOB 2: Đánh dấu booking hoàn thành (MỖI NGÀY LÚC 00:00)
 */
cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Checking for completed bookings...');
    try {
        const count = await Booking.markCompletedBookings(io); // ✅ TRUYỀN io
        if (count > 0) {
            console.log(`[CRON] Successfully marked ${count} bookings as completed.`);
        }
    } catch (error) {
        console.error('[CRON] Error marking completed bookings:', error);
    }
});

/**
 * CRON JOB 3: Đánh dấu promotions hết hạn (MỖI GIỜ)
 */
cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Updating promotion statuses...');
    try {
        const expired = await Promotion.markExpiredPromotions();
        const activated = await Promotion.activateScheduledPromotions();
        
        if (expired > 0 || activated > 0) {
            console.log(`[CRON] Promotions updated: ${expired} expired, ${activated} activated`);
        }
    } catch (error) {
        console.error('[CRON] Error updating promotions:', error);
    }
});

// --- Khởi động Server ---
const PORT = process.env.PORT || 5000;
// Kiểm tra kết nối DB trước khi khởi động server
checkConnection().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`🔌 Socket.IO is listening on port ${PORT}`);
    });
});
