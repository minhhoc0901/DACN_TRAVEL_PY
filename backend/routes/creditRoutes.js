const express = require('express');
const router = express.Router();
const creditController = require('../controllers/creditController');
const authMiddleware = require('../middlewares/autMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { validateWithdrawal, validateWithdrawalStatus } = require('../utils/validators/creditValidator');

/**
 * @route   GET /api/credits/balance
 * @desc    Lấy số dư Credit
 * @access  Private
 */
router.get('/balance', authMiddleware.verifyToken, creditController.getBalance);

/**
 * @route   GET /api/credits/transactions
 * @desc    Lấy lịch sử giao dịch
 * @access  Private
 */
router.get('/transactions', authMiddleware.verifyToken, creditController.getTransactionHistory);

/**
 * @route   POST /api/credits/withdraw
 * @desc    Yêu cầu rút tiền
 * @access  Private
 */
router.post(
    '/withdraw', 
    authMiddleware.verifyToken, 
    // validate(validateWithdrawal),
    creditController.requestWithdrawal);

/**
 * @route   GET /api/credits/withdrawals
 * @desc    Lấy danh sách yêu cầu rút tiền của user
 * @access  Private
 */
router.get('/withdrawals', authMiddleware.verifyToken, creditController.getMyWithdrawals);

// =============================================
// ADMIN ROUTES
// =============================================

/**
 * @route   GET /api/credits/admin/withdrawals/stats
 * @desc    Lấy thống kê rút tiền (Admin)
 * @access  Admin
 */
router.get('/admin/withdrawals/stats', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    creditController.adminGetWithdrawalStats
);

/**
 * @route   GET /api/credits/admin/withdrawals
 * @desc    Lấy tất cả yêu cầu rút tiền (Admin)
 * @access  Admin
 */
router.get('/admin/withdrawals', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    creditController.adminGetAllWithdrawals
);

/**
 * @route   GET /api/credits/admin/withdrawals/:id
 * @desc    Lấy chi tiết yêu cầu rút tiền (Admin)
 * @access  Admin
 */
router.get('/admin/withdrawals/:id', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    creditController.adminGetWithdrawalById
);

/**
 * @route   PUT /api/credits/admin/withdrawals/:id/approve
 * @desc    Duyệt yêu cầu rút tiền (Admin)
 * @access  Admin
 */
router.put('/admin/withdrawals/:id/approve', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    // validate(validateWithdrawalStatus),
    creditController.adminApproveWithdrawal
);

/**
 * @route   PUT /api/credits/admin/withdrawals/:id/reject
 * @desc    Từ chối yêu cầu rút tiền (Admin)
 * @access  Admin
 */
router.put('/admin/withdrawals/:id/reject', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    creditController.adminRejectWithdrawal
);

/**
 * @route   PUT /api/credits/admin/withdrawals/:id/complete
 * @desc    Đánh dấu đã chuyển tiền (Admin)
 * @access  Admin
 */
router.put('/admin/withdrawals/:id/complete', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    creditController.adminCompleteWithdrawal
);

module.exports = router;