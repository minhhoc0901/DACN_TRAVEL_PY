const express = require('express');
const router = express.Router();
const adminNotificationController = require('../controllers/adminNotificationController');
const authMiddleware = require('../middlewares/autMiddleware');

// Middleware: Chỉ admin mới truy cập được
router.use(authMiddleware.verifyToken, authMiddleware.isAdmin);

// Lấy tất cả thông báo
router.get('/all', adminNotificationController.getAllNotifications);

// Lấy thống kê
router.get('/stats', adminNotificationController.getNotificationStats);

// Gửi thông báo hàng loạt
router.post('/send-bulk', adminNotificationController.sendBulkNotification);

// Xóa thông báo
router.delete('/:id', adminNotificationController.deleteNotification);

module.exports = router;