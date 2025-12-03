const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/autMiddleware');

// Gửi tin nhắn mới (có thể để cho người dùng không đăng nhập cũng chat được)
router.post('/send', authMiddleware.optionalAuth, chatController.sendMessage);

// Lấy lịch sử chat
router.get('/conversation', authMiddleware.optionalAuth, chatController.getConversation);

module.exports = router;