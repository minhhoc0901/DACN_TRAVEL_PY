const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/autMiddleware');

/**
 * @route   GET /api/dashboard/overview
 * @desc    Lấy tổng quan dashboard
 * @access  Admin
 */
router.get('/overview', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    dashboardController.getDashboardOverview
);

/**
 * @route   GET /api/dashboard/detailed
 * @desc    Lấy thống kê chi tiết theo khoảng thời gian
 * @access  Admin
 */
router.get('/detailed', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    dashboardController.getDashboardDetailedStats
);

module.exports = router;