const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const authMiddleware = require('../middlewares/autMiddleware');

// Route để gửi tin nhắn liên hệ (có thể là public hoặc chỉ cần user đăng nhập)
// router.post('/send', contactController.createContactMessage); // Ví dụ
router.post('/submit', contactController.submitContact); // Add this line

// Route để admin lấy tất cả tin nhắn liên hệ
router.get(
    '/messages',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    contactController.getContactMessages
);

// Các routes khác cho contact...

module.exports = router;