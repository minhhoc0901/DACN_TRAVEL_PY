const express = require('express');
const router = express.Router();
const locationCommentController = require('../controllers/locationCommentController');
const authMiddleware = require('../middlewares/autMiddleware');

// Thêm comment (yêu cầu đăng nhập)
router.post('/', authMiddleware.verifyToken, locationCommentController.addComment);

// Lấy tất cả comments của một địa điểm
router.get('/:locationId', locationCommentController.getCommentsByLocation);

// Xóa comment (yêu cầu đăng nhập)
router.delete('/:commentId', authMiddleware.verifyToken, locationCommentController.deleteComment);

module.exports = router;