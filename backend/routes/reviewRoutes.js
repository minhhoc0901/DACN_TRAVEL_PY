const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/autMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { validateReview } = require('../utils/validators/reviewValidator');

// POST /api/reviews - Thêm đánh giá mới (yêu cầu đăng nhập + validation)
router.post(
    '/', 
    authMiddleware.verifyToken, 
    validate(validateReview),
    reviewController.addReview
);

// GET /api/reviews/tour/:tourId - Lấy tất cả đánh giá cho một tour
router.get('/tour/:tourId', reviewController.getTourReviews);

// GET /api/reviews/stats/:tourId - Thống kê review theo tour
router.get('/stats/:tourId', reviewController.getReviewStatsByTour);

module.exports = router;