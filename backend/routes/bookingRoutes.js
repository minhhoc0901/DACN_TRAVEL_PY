const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/bookingController');
const authenticate = require('../middlewares/autMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { validateBooking, validateCancelBooking, validateUpdateBookingStatus } = require('../utils/validators/bookingValidator');

// ===== USER ROUTES =====
router.post('/quote', authenticate.verifyToken, bookingCtrl.quote);
router.post('/', 
    authenticate.verifyToken, 
    validate(validateBooking),
    bookingCtrl.createBooking);
router.get('/verify/:token', bookingCtrl.verifyBookingByToken);
router.get('/my-bookings', authenticate.verifyToken, bookingCtrl.getMyBookings);
router.put('/my-bookings/:id', 
    authenticate.verifyToken,
    validate(validateCancelBooking), 
    bookingCtrl.cancelMyBooking);
// HỦY BOOKING ĐÃ THANH TOÁN VỚI CHÍNH SÁCH HOÀN TIỀN
router.put('/my-bookings/:bookingId/cancel-paid', authenticate.verifyToken, bookingCtrl.cancelPaidBooking);
router.delete('/my-bookings/delete/:id', authenticate.verifyToken, bookingCtrl.deleteMyBooking);
router.put('/my-booking/hide/:id', authenticate.verifyToken, bookingCtrl.hideMyBooking);
router.get('/:id/invoice/pdf', authenticate.verifyToken, bookingCtrl.getInvoicePdf);

// ===== ADMIN ROUTES =====
// Thống kê
router.get('/admin/stats', authenticate.verifyToken, authenticate.isAdmin, bookingCtrl.getBookingStats);

// Xuất báo cáo
router.get('/admin/export', authenticate.verifyToken, authenticate.isAdmin, bookingCtrl.exportBookingsReport);

// Danh sách booking
router.get('/admin/all', authenticate.verifyToken, authenticate.isAdmin, bookingCtrl.getAllBookingsAdmin);

// Chi tiết booking
router.get('/admin/:bookingId', authenticate.verifyToken, authenticate.isAdmin, bookingCtrl.getBookingDetailAdmin);

// Cập nhật trạng thái
router.put('/admin/:bookingId/status', 
    authenticate.verifyToken, 
    authenticate.isAdmin, 
    validate(validateUpdateBookingStatus),
    bookingCtrl.updateBookingStatusAdmin);

// Đánh dấu hoàn thành thủ công
router.put('/admin/:bookingId/complete', authenticate.verifyToken, authenticate.isAdmin, bookingCtrl.markBookingAsCompleted);

// Trigger cron job thủ công
router.post('/admin/trigger-mark-completed', authenticate.verifyToken, authenticate.isAdmin, bookingCtrl.triggerMarkCompletedJob);

module.exports = router;