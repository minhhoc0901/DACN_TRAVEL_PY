const {pool} = require('../config/db');
const TourPrice = require('../models/TourPrice');
const BookingDetail = require('../models/BookingDetail');
const Promotion = require('../models/Promotions');
const Booking = require('../models/Booking');

exports.quote = async (req, res) => {
    try {
        const { tourId, items } = req.body;
        const prices = await TourPrice.listByTour(tourId);
        const { original } = BookingDetail.calcFromSelection(items, prices);
        res.json({ success: true, originalAmount: original });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message });
    }
};

exports.createBooking = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { tourId, startDate, items, promotionCode, contact } = req.body;
        const userId = req.user.id;

        await conn.beginTransaction();

        const prices = await TourPrice.listByTour(tourId);
        const { original, details } = BookingDetail.calcFromSelection(items, prices);

        let discount = 0;
        let promoId = null;
        if (promotionCode) {
            const promo = await Promotion.getByCodeForUpdate(promotionCode, conn);
            if (!promo) throw new Error('Mã khuyến mãi không hợp lệ');
            if (promo.max_usage && promo.usage_count >= promo.max_usage)
                throw new Error('Mã đã hết lượt');

            discount = promo.discount_type === 'percentage'
                ? (original * promo.discount_value) / 100
                : promo.discount_value;

            if (discount > original) discount = original;
            promoId = promo.id;
            await Promotion.incrementUsage(promo.id, conn);
        }

        const finalAmount = original - discount;

        const bookingId = await Booking.create(conn, {
            userId, tourId, startDate,
            originalAmount: original,
            finalAmount,
            discountAmount: discount,
            promotionId: promoId,
            contact
        });

        await BookingDetail.bulkInsert(conn, bookingId, details);

        await conn.commit();
        res.json({ success: true, bookingId, originalAmount: original, finalAmount, discountAmount: discount });
    } catch (e) {
        try { await conn.rollback(); } catch {}
        res.status(400).json({ success: false, message: e.message });
    } finally {
        conn.release();
    }
};
/**
 * Lấy lịch sử đặt tour của người dùng đã đăng nhập
 */
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const bookings = await Booking.findByUser(userId);
        res.json({ success: true, data: bookings });
    } catch (e) {
        console.error('[GET MY BOOKINGS] Error:', e);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi lấy lịch sử đặt tour.' });
    }
};
exports.cancelMyBooking = async (req, res) => {
    try {
        const { id: bookingId } = req.params;
        const userId = req.user.id;

        const affectedRows = await Booking.cancelByUser(bookingId, userId);

        if (affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy đơn đặt tour hoặc đơn đã được xử lý và không thể hủy.' 
            });
        }

        res.json({ success: true, message: 'Đã hủy đơn đặt tour thành công.' });

    } catch (e) {
        console.error('[CANCEL MY BOOKING] Error:', e);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi hủy đơn đặt tour.' });
    }
};
/**
 * Người dùng xóa vĩnh viễn booking của mình.
 */
exports.deleteMyBooking = async (req, res) => {
    try {
        const { id: bookingId } = req.params;
        const userId = req.user.id;

        const affectedRows = await Booking.deleteByUser(bookingId, userId);

        if (affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy đơn đặt tour hoặc đơn đã được xác nhận và không thể xóa.' 
            });
        }

        res.json({ success: true, message: 'Đã xóa đơn đặt tour thành công.' });

    } catch (e) {
        console.error('[DELETE MY BOOKING] Error:', e);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xóa đơn đặt tour.' });
    }
};