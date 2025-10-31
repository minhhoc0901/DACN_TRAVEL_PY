const Review = require('../models/Review');
const { getTourById } = require('../models/Tour');
const Notification = require('../models/Notification');
const NOTIFICATION_TYPES = require('../constants/notificationTypes');
const path = require('path');
const fs = require('fs');


exports.addReview = async (req, res) => {
    try {
        const { tour_id, rating, comment } = req.body;
        
        if (!req.user || req.user.id === undefined) {
             return res.status(401).json({ 
                 success: false, 
                 message: 'Người dùng không được xác thực.' 
             });
        }
        const user_id = req.user.id;

        if (!tour_id || !rating || !comment) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tour ID, rating, và comment là bắt buộc.' 
            });
        }
        if (isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 5) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rating phải là số từ 1 đến 5.' 
            });
        }

        const tour = await getTourById(tour_id);
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tour'
            });
        }

        console.log('[Review Controller] ====================================');
        console.log('[Review Controller] Tour info:', {
            tour_id: tour.id,
            tour_owner: tour.user_id,
            reviewer: user_id,
            tour_destination: tour.destination
        });
        console.log('[Review Controller] ====================================');

        // Handle image uploads
        const imageUrls = [];
        const savedFilePaths = [];

        if (req.files && req.files.reviewImages) {
            const reviewImages = Array.isArray(req.files.reviewImages) 
                ? req.files.reviewImages 
                : [req.files.reviewImages];
            
            const uploadDir = path.join(__dirname, '../uploads/review_images');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            for (const imageFile of reviewImages) {
                if (!imageFile.mimetype.startsWith('image')) {
                    console.warn(`Skipping non-image file: ${imageFile.name}`);
                    continue;
                }
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileName = `review-${user_id}-${tour_id}-${uniqueSuffix}${path.extname(imageFile.name)}`;
                const filePath = path.join(uploadDir, fileName);
                
                try {
                    await imageFile.mv(filePath);
                    imageUrls.push(`/uploads/review_images/${fileName}`);
                    savedFilePaths.push(filePath);
                } catch (uploadError) {
                    console.error("Error moving uploaded file:", uploadError);
                    savedFilePaths.forEach(fp => fs.existsSync(fp) && fs.unlinkSync(fp));
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Lỗi khi tải lên hình ảnh.' 
                    });
                }
            }
        }

        const reviewData = { tour_id, user_id, rating: parseInt(rating), comment, imageUrls };
        const newReview = await Review.createReview(reviewData);

        console.log('[Review Controller] ✅ Review created:', newReview);

        // ✅ TẠO NOTIFICATION CHO CHỦ TOUR
        if (tour.user_id && tour.user_id !== user_id) {
            try {
                const reviewerName = req.user?.full_name || req.user?.username || 'Một người dùng';
                const starEmoji = '⭐'.repeat(parseInt(rating));
                const message = `${reviewerName} đã đánh giá ${starEmoji} (${rating}/5) tour "${tour.destination}" của bạn`;

                console.log('[Review Controller] 🔔 Creating notification...');
                console.log('[Review Controller] Target user_id:', tour.user_id);
                console.log('[Review Controller] Message:', message);

                const notification = await Notification.createNotificationWithType(
                  tour.user_id,
                  message,
                  NOTIFICATION_TYPES.NEW_REVIEW,
                  parseInt(tour_id),
                  `/itinerary/${tour_id}`
                );

                // ✅ EMIT NOTIFICATION QUA SOCKET.IO
                const io = req.app.get('io');

                if (io) {
                  // Lấy lại thông báo đầy đủ từ DB để gửi qua socket
                  const fullNotificationData = await Notification.getNotificationById(notification.id);

                  if (fullNotificationData) {
                    const roomName = `user_${tour.user_id}`;
                    
                    // Gửi thông báo qua socket
                    io.to(roomName).emit('new_notification', fullNotificationData);
                    console.log(`[Review Controller] ✅ Emitted full notification to ${roomName}`);
                  } else {
                    console.error('[Review Controller] ❌ Could not fetch full notification data for ID:', notification.id);
                  }
                } else {
                  console.error('[Review Controller] ❌ Socket.IO instance NOT FOUND!');
                }

                // Trả về review mới cho người đánh giá
                res.status(201).json({
                    success: true, 
                    message: 'Thêm đánh giá thành công!', 
                    review: newReview 
                });
            } catch (notifError) {
                console.error('[Review Controller] ❌ Error creating notification:', notifError);
            }
        } else {
            console.log('[Review Controller] ℹ️ Reviewer is tour owner or tour has no owner, skipping notification');
        }

        res.status(201).json({ 
            success: true, 
            message: 'Thêm đánh giá thành công!', 
            review: newReview 
        });
    } catch (error) {
        console.error('[Review Controller] ❌ Add review error:', error);
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
        if (isNaN(parseInt(tourId))) {
            return res.status(400).json({ success: false, message: 'Tour ID không hợp lệ.' });
        }
        const reviews = await Review.getReviewsByTourId(tourId);
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error('Get tour reviews error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đánh giá.', error: error.message });
    }
};

exports.getReviewStatsByTour = async (req, res) => {
    try {
        const { tourId } = req.params;

        if (!tourId || isNaN(parseInt(tourId, 10))) {
            return res.status(400).json({ 
                message: "Tour ID không hợp lệ." 
            });
        }

        const stats = await Review.getReviewStatsByTourId(parseInt(tourId, 10));
        return res.status(200).json(stats);

    } catch (error) {
        console.error("❌ Lỗi tại getReviewStatsByTour:", error);
        res.status(500).json({
            message: "Đã xảy ra lỗi khi lấy dữ liệu thống kê review.",
            error: error.message,
        });
    }
};