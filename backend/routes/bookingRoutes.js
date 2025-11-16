const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/bookingController');
const  authenticate  = require('../middlewares/autMiddleware');

router.post('/quote', authenticate.verifyToken, bookingCtrl.quote);
router.post('/', authenticate.verifyToken, bookingCtrl.createBooking);
router.get('/verify/:token', bookingCtrl.verifyBookingByToken);
router.get('/:id/invoice/pdf', authenticate.verifyToken, bookingCtrl.getInvoicePdf);
router.get('/my-bookings', authenticate.verifyToken, bookingCtrl.getMyBookings);
router.put('/my-bookings/:id', authenticate.verifyToken, bookingCtrl.cancelMyBooking);
router.delete('/my-bookings/delete/:id', authenticate.verifyToken, bookingCtrl.deleteMyBooking);
router.put('/my-booking/hide/:id', authenticate.verifyToken, bookingCtrl.hideMyBooking);

module.exports = router;