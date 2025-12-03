const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const auth = require('../middlewares/autMiddleware');

/**
 * ========================================
 * ADMIN ROUTES
 * ========================================
 */

// ✅ Lấy thống kê refund (PHẢI ĐẶT TRƯỚC :id)
router.get(
  '/admin/stats',
  auth.verifyToken,
  auth.isAdmin,
  refundController.getRefundStats
);

// ✅ Lấy danh sách tất cả refund (có filter)
router.get(
  '/admin',
  auth.verifyToken,
  auth.isAdmin,
  refundController.getAllRefunds
);

// ✅ Lấy chi tiết một refund
router.get(
  '/admin/:id',
  auth.verifyToken,
  auth.isAdmin,
  refundController.getRefundById
);

// ✅ Duyệt yêu cầu hoàn tiền
router.put(
  '/admin/:id/approve',
  auth.verifyToken,
  auth.isAdmin,
  refundController.approveRefund
);

// ✅ Từ chối yêu cầu hoàn tiền
router.put(
  '/admin/:id/reject',
  auth.verifyToken,
  auth.isAdmin,
  refundController.rejectRefund
);

// ✅ Hoàn thành bank transfer (admin đã chuyển tiền thủ công)
router.put(
  '/admin/:id/complete-transfer',
  auth.verifyToken,
  auth.isAdmin,
  refundController.completeBankTransfer
);

/**
 * ========================================
 * USER ROUTES
 * ========================================
 */

// ✅ Lấy danh sách refund của user hiện tại
router.get(
  '/user',
  auth.verifyToken,
  refundController.getUserRefunds
);

// ✅ Lấy chi tiết một refund của user
router.get(
  '/user/:id',
  auth.verifyToken,
  refundController.getUserRefundById
);

module.exports = router;