const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/autMiddleware'); // Đảm bảo bạn đã có middleware này

// POST /api/reviews - Thêm đánh giá mới (yêu cầu đăng nhập)
router.post('/', authMiddleware.verifyToken, reviewController.addReview);

// GET /api/reviews/tour/:tourId - Lấy tất cả đánh giá cho một tour
router.get('/tour/:tourId', reviewController.getTourReviews);

//  Route thống kê review theo tour
router.get("/stats/:tourId", reviewController.getReviewStatsByTour);

module.exports = router;