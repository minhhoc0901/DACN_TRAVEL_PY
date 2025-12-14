const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/autMiddleware');

const router = express.Router();

// Apply auth middleware cho tất cả các routes
router.use(authMiddleware.verifyToken);

// Lấy danh sách tất cả người dùng (chỉ admin)
router.get('/', authMiddleware.isAdmin, userController.getAllUsers);

// Lấy thông tin một người dùng
router.get('/:id', userController.getUserById);

// Cập nhật thông tin người dùng
router.put('/:id', userController.updateUser);

// Thêm route đổi mật khẩu
router.put('/:id/change-password', userController.changePassword);

// Xóa người dùng (chỉ admin)
router.delete('/:id', authMiddleware.isAdmin, userController.deleteUser);

// Thêm route mới cho việc tải lên avatar
router.post('/:id/avatar', userController.uploadAvatar);

module.exports = router;