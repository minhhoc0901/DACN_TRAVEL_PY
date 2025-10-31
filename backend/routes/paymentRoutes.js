const express = require('express');
const router = express.Router();
const paymentCtrl = require('../controllers/paymentController');
const  authMiddleware  = require('../middlewares/autMiddleware');

router.post('/vnpay/init', authMiddleware.verifyToken, paymentCtrl.initVnpay);
router.get('/vnpay/return', paymentCtrl.vnpReturn);
router.get('/vnpay/ipn', paymentCtrl.vnpIpn);



module.exports = router;