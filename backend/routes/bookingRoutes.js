const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/bookingController');
const  authenticate  = require('../middlewares/autMiddleware');

router.post('/quote', authenticate.verifyToken, bookingCtrl.quote);
router.post('/', authenticate.verifyToken, bookingCtrl.createBooking);
router.get('/my-bookings', authenticate.verifyToken, bookingCtrl.getMyBookings);
router.delete('/my-bookings/:id', authenticate.verifyToken, bookingCtrl.cancelMyBooking);
router.delete('/my-bookings/delete/:id', authenticate.verifyToken, bookingCtrl.deleteMyBooking);

module.exports = router;