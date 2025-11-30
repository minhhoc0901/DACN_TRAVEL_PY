
const express = require('express');
const router = express.Router();
const chatWithAdminController = require('../controllers/chatWithAdminController');
const authMiddleware = require('../middlewares/autMiddleware');

// === CÁC ROUTE CÔNG KHAI HOẶC CHO USER ===

// Lấy ID của admin (Công khai)
router.get('/admin-id', chatWithAdminController.getAdminId);

// ✅ Tải ảnh lên cho chat (Yêu cầu người dùng phải đăng nhập)
router.post('/upload-image', authMiddleware.verifyToken, chatWithAdminController.uploadImage);

// === CÁC ROUTE CHỈ DÀNH CHO ADMIN ===

// ✅ Lấy danh sách user đã chat (Chỉ admin được xem)
router.get('/users', authMiddleware.verifyToken, authMiddleware.isAdmin, chatWithAdminController.getChatUsers);

// === CÁC ROUTE API DỰ PHÒNG ===

router.get('/conversation', authMiddleware.optionalAuth, chatWithAdminController.getConversation);
router.post('/send', authMiddleware.optionalAuth, chatWithAdminController.sendMessage);

module.exports = router;