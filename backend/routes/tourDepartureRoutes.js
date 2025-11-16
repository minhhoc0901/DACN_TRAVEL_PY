const express = require('express');
const router = express.Router();
const departureController = require('../controllers/tourDepartureController');
const auth = require('../middlewares/autMiddleware');

// === PUBLIC ROUTES ===
// Lấy danh sách lịch khởi hành còn trống cho một tour cụ thể
router.get('/:tourId/available', departureController.getAvailableDepartures);

// === ADMIN ROUTES ===
// Lấy tất cả lịch khởi hành của một tour
router.get('/:tourId', auth.verifyToken, auth.isAdmin, departureController.getAllDeparturesForTour);

// Tạo lịch khởi hành mới
router.post('/', auth.verifyToken, auth.isAdmin, departureController.createDeparture);

// Cập nhật và Xóa một lịch khởi hành cụ thể
router.route('/:id')
    .put(auth.verifyToken, auth.isAdmin, departureController.updateDeparture)
    .delete(auth.verifyToken, auth.isAdmin, departureController.deleteDeparture);

module.exports = router;