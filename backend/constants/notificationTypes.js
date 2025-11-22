const Review = require('../models/Review');
const Tour = require('../models/Tour');
const Notification = require('../models/Notification');
const NOTIFICATION_TYPES = require('../constants/notificationTypes');
const path = require('path');
const fs = require('fs');

module.exports = {
  TOUR_APPROVED: 'tour_approved',
  TOUR_REJECTED: 'tour_rejected',
  NEW_MESSAGE: 'new_message',
  REVIEW_REPLY: 'review_reply',
  NEW_REVIEW: 'new_review',
  NEW_LOCATION_COMMENT: 'new_location_comment', 
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  PAYMENT_SUCCESS: 'payment_success',
  SYSTEM: 'system'
};

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
            const uploadDir = path.join(__dirname, '../uploads/reviews');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            for (const file of files) {
                const fileName = `${Date.now()}_${file.name}`;
                const filePath = path.join(uploadDir, fileName);
                await file.mv(filePath);
                imageUrls.push(`/uploads/reviews/${fileName}`);
            }
        }

        const reviewData = { tour_id, user_id, rating: parseInt(rating), comment, imageUrls };
        const newReview = await Review.createReview(reviewData);

        console.log('[Review] ✅ Review created:', newReview.id);

        // ✅ TẠO VÀ GỬI NOTIFICATION
        if (tour.user_id && tour.user_id !== user_id) {
            try {
                const reviewerName = req.user?.full_name || req.user?.username || 'Một người dùng';
                const message = `${reviewerName} đã đánh giá (${rating}/5) tour "${tour.destination}" của bạn`;
                const actionUrl = `/tours/${tour_id}`;

                console.log('[Review] Creating notification for user:', tour.user_id);

                const notification = await Notification.createNotificationWithType(
                    tour.user_id,
                    message,
                    NOTIFICATION_TYPES.NEW_REVIEW,
                    parseInt(tour_id),
                    actionUrl
                );

                console.log('[Review] ✅ Notification created:', notification.id);

                // ✅ EMIT QUA SOCKET
                const io = req.app.get('io');
                if (io) {
                    const fullNotificationData = await Notification.getNotificationById(notification.id);
                    if (fullNotificationData) {
                        const roomName = `user_${tour.user_id}`;
                        
                        console.log(`[Review] 📡 Emitting to room: ${roomName}`);
                        console.log(`[Review] 📡 Notification data:`, fullNotificationData);
                        
                        io.to(roomName).emit('new_notification', fullNotificationData);
                        
                        console.log(`[Review] ✅ Notification emitted successfully`);
                    } else {
                        console.error('[Review] ❌ Could not fetch full notification');
                    }
                } else {
                    console.error('[Review] ❌ Socket.IO instance not found');
                }
            } catch (notifError) {
                console.error('[Review] ❌ Notification error:', notifError);
            }
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