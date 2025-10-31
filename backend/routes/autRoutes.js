const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/autMiddleware'); 

// Đăng ký người dùng mới
router.post('/register', authController.register);

// Đăng nhập
router.post('/login', authController.login);

// Lấy thông tin profile của người dùng đã đăng nhập
router.get('/profile', authMiddleware.verifyToken, authController.getProfile);

router.post('/send-otp', authController.sendOTP);
router.post('/forgot-password', authController.sendOTP);
router.post('/verify-reset-otp', authController.verifyResetOTP);
router.post('/reset-password', authController.resetPassword);

module.exports = router;