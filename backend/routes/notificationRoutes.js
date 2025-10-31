const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/autMiddleware');

// Tạo thông báo mới
router.post('/', authMiddleware.verifyToken, notificationController.createNotification);

// Lấy danh sách thông báo của người dùng
router.get('/', authMiddleware.verifyToken, notificationController.getNotifications);

// Đánh dấu thông báo là đã đọc
router.put('/:notificationId/read', authMiddleware.verifyToken, notificationController.markAsRead);

// Đếm số thông báo chưa đọc
router.get('/unread-count', authMiddleware.verifyToken, notificationController.getUnreadCount);

// Đánh dấu tất cả là đã đọc
router.put('/mark-all-read', authMiddleware.verifyToken, notificationController.markAllAsRead);

router.delete('/:notificationId', authMiddleware.verifyToken, notificationController.deleteNotification);

module.exports = router;