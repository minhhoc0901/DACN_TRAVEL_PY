const Refund = require('../models/Refund');
const NotificationService = require('../utils/notificationService');

/**
 * ✅ [ADMIN] Lấy danh sách refund
 */
exports.getAllRefunds = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      search: req.query.search
    };

    const result = await Refund.getAll(filters);

    res.json({
      success: true,
      data: result.refunds,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('[getAllRefunds] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách refund'
    });
  }
};

/**
 * ✅ [ADMIN] Lấy chi tiết refund
 */
exports.getRefundById = async (req, res) => {
  try {
    const { id } = req.params;
    const refund = await Refund.getById(id);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu hoàn tiền'
      });
    }

    res.json({
      success: true,
      data: refund
    });
  } catch (error) {
    console.error('[getRefundById] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin refund'
    });
  }
};

/**
 * ✅ [ADMIN] Duyệt refund
 */
exports.approveRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { admin_note } = req.body;

    const result = await Refund.approveRefund(id, adminId, admin_note);

    // ✅ GỬI THÔNG BÁO SAU KHI DUYỆT
    if (result.success && result.refund) {
      setImmediate(async () => {
        try {
          const io = req.app.get('io');
          if (io && NotificationService.notifyRefundApproved) {
            await NotificationService.notifyRefundApproved(
              io,
              result.refund.user_id,
              result.refund.booking_id,
              result.refund.tour_name,
              result.refund.refund_amount,
              result.refund.refund_method
            );
          }
        } catch (err) {
          console.error('[approveRefund] Error sending notification:', err);
        }
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: result.refund
    });
  } catch (error) {
    console.error('[approveRefund] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Không thể duyệt refund'
    });
  }
};

/**
 * ✅ [ADMIN] Từ chối refund
 */
exports.rejectRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { admin_note } = req.body;

    if (!admin_note || admin_note.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối'
      });
    }

    const result = await Refund.rejectRefund(id, adminId, admin_note);

    // ✅ GỬI THÔNG BÁO SAU KHI TỪ CHỐI
    if (result.success && result.refund) {
      setImmediate(async () => {
        try {
          const io = req.app.get('io');
          if (io && NotificationService.notifyRefundRejected) {
            await NotificationService.notifyRefundRejected(
              io,
              result.refund.user_id,
              result.refund.booking_id,
              result.refund.tour_name,
              admin_note
            );
          }
        } catch (err) {
          console.error('[rejectRefund] Error sending notification:', err);
        }
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: result.refund
    });
  } catch (error) {
    console.error('[rejectRefund] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Không thể từ chối refund'
    });
  }
};

/**
 * ✅ [ADMIN] Hoàn thành bank transfer
 */
exports.completeBankTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { transaction_ref } = req.body;

    if (!transaction_ref) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã giao dịch'
      });
    }

    const result = await Refund.completeBankTransfer(id, adminId, transaction_ref);

    res.json(result);
  } catch (error) {
    console.error('[completeBankTransfer] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Không thể hoàn thành'
    });
  }
};

/**
 * ✅ [ADMIN] Thống kê refund
 */
exports.getRefundStats = async (req, res) => {
  try {
    const stats = await Refund.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[getRefundStats] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thống kê'
    });
  }
};

/**
 * ✅ [USER] Lấy danh sách refund của user hiện tại
 */
exports.getUserRefunds = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;

    const result = await Refund.getUserRefunds(userId, { page, limit });

    res.json({
      success: true,
      data: result.refunds,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('[getUserRefunds] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách refund'
    });
  }
};

/**
 * ✅ [USER] Lấy chi tiết refund của user
 */
exports.getUserRefundById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const refund = await Refund.getUserRefundById(id, userId);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu hoàn tiền'
      });
    }

    res.json({
      success: true,
      data: refund
    });
  } catch (error) {
    console.error('[getUserRefundById] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin refund'
    });
  }
};