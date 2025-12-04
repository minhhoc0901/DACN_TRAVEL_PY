const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/autMiddleware');

// Middleware kiểm tra quyền admin cho tất cả routes
router.use(authMiddleware.verifyToken, authMiddleware.isAdmin);

// Routes quản lý user
router.get('/users', userController.getAllUsers);
router.put('/users/:id/role', userController.updateUserRole);
router.delete('/users/:id', userController.deleteUser);

module.exports = router;