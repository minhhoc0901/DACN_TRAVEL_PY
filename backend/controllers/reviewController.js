const Review = require('../models/Review');
const Tour = require('../models/Tour');
const { uploadToCloudinary } = require('../utils/cloudinaryHelper');
const NotificationService = require('../utils/notificationService');

exports.addReview = async (req, res) => {
    try {
        const { tour_id, rating, comment } = req.body;
        const user_id = req.user.id;

        console.log('[Review] New review request:', { tour_id, user_id, rating });

        const tour = await Tour.getTourById(tour_id);
        if (!tour) {
            return res.status(404).json({ success: false, message: 'Tour không tồn tại' });
        }

        let imageUrls = [];
        if (req.files && req.files.images) {
            const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
            
            for (const file of files) {
                // --- CLOUDINARY UPLOAD ---
                const cloudResult = await uploadToCloudinary(file.data, 'reviews');
                imageUrls.push(cloudResult.url);
            }
        }

        const reviewData = { tour_id, user_id, rating: parseInt(rating), comment, imageUrls };
        const newReview = await Review.createReview(reviewData);

        console.log('[Review] ✅ Review created:', newReview.id);

        
        // GỬI THÔNG BÁO CHO CHỦ TOUR
        if (tour.user_id && tour.user_id !== user_id) {
            const io = req.app.get('io');
            const reviewerName = req.user?.full_name || req.user?.username || 'Một người dùng';
            
            await NotificationService.notifyNewReview(
                io,
                tour.user_id,
                tour.id,
                tour.destination,
                reviewerName,
                rating
            );
        }

        res.status(201).json({
            success: true, 
            message: 'Thêm đánh giá thành công!', 
            review: newReview 
        });
    } catch (error) {
        console.error('[Review] ❌ Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi thêm đánh giá.', 
            error: error.message 
        });
    }
};

exports.getTourReviews = async (req, res) => {
    try {
        const { tourId } = req.params;
        const reviews = await Review.getReviewsByTourId(tourId);
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy đánh giá.' });
    }
};

exports.getReviewStatsByTour = async (req, res) => {
    try {
        const { tourId } = req.params;
        const stats = await Review.getReviewStatsByTourId(tourId);
        res.status(200).json({ 
            success: true, 
            stats 
        });
    } catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy thống kê đánh giá.',
            error: error.message 
        });
    }
};