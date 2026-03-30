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

// Gửi OTP
router.post('/send-otp', authController.sendOTP);
router.post('/forgot-password', authController.sendOTP);
router.post('/verify-reset-otp', authController.verifyResetOTP);
router.post('/reset-password', authController.resetPassword);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const authController = require('../controllers/authController');
// const authMiddleware = require('../middlewares/autMiddleware');
// const { validate } = require('../middlewares/validationMiddleware');
// const { 
//     validateRegister, 
//     validateLogin, 
//     validateRequestOtp, 
//     validateVerifyOtp, 
//     validateResetPassword 
// } = require('../utils/validators/authValidator');

// // POST /api/auth/register - Đăng ký (validation)
// router.post(
//     '/register', 
//     validate(validateRegister),
//     authController.register
// );

// // POST /api/auth/login - Đăng nhập (validation)
// router.post(
//     '/login', 
//     validate(validateLogin),
//     authController.login
// );

// // GET /api/auth/profile - Lấy profile
// router.get('/profile', authMiddleware.verifyToken, authController.getProfile);

// // POST /api/auth/send-otp - Gửi OTP (validation)
// router.post(
//     '/send-otp', 
//     validate(validateRequestOtp),
//     authController.sendOTP
// );

// router.post(
//     '/forgot-password', 
//     validate(validateRequestOtp),
//     authController.sendOTP
// );

// // POST /api/auth/verify-reset-otp - Verify OTP (validation)
// router.post(
//     '/verify-reset-otp', 
//     validate(validateVerifyOtp),
//     authController.verifyResetOTP
// );

// // POST /api/auth/reset-password - Reset password (validation)
// router.post(
//     '/reset-password', 
//     validate(validateResetPassword),
//     authController.resetPassword
// );

// module.exports = router;