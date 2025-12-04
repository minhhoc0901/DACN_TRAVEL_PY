const UserCredit = require('../models/UserCredit');
const NotificationService = require('../utils/notificationService');

/**
 * @route   GET /api/credits/balance
 * @desc    Lấy số dư Credit của user
 * @access  Private
 */
exports.getBalance = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const balance = await UserCredit.getBalance(userId);

        res.json({
            success: true,
            data: { balance }
        });
    } catch (error) {
        console.error('[GET BALANCE] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy số dư Credit'
        });
    }
};

/**
 * @route   GET /api/credits/transactions
 * @desc    Lấy lịch sử giao dịch Credit
 * @access  Private
 */
exports.getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;

        const transactions = await UserCredit.getTransactionHistory(userId, limit);

        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('[GET TRANSACTIONS] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy lịch sử giao dịch'
        });
    }
};

/**
 * @route   POST /api/credits/withdraw
 * @desc    Yêu cầu rút tiền về ngân hàng
 * @access  Private
 */
exports.requestWithdrawal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, bankName, accountNumber, accountName } = req.body;

        // Validate input
        if (!amount || amount < 50000) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền rút tối thiểu là 50.000 VNĐ'
            });
        }

        if (!bankName || !accountNumber || !accountName) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin ngân hàng'
            });
        }

        // Kiểm tra số dư
        const balance = await UserCredit.getBalance(userId);
        if (balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Số dư không đủ để rút'
            });
        }

        // Tạo yêu cầu rút tiền
        const withdrawalRequest = await UserCredit.createWithdrawalRequest(
            userId,
            amount,
            bankName,
            accountNumber,
            accountName
        );

        // TODO: Gửi thông báo cho admin
        const io = req.app.get('io');
        const adminIds = await NotificationService.getAdminIds();
        
        for (const adminId of adminIds) {
            await NotificationService.createAndEmit(
                io,
                adminId,
                `💰 Yêu cầu rút tiền mới từ User ${userId}\n\nSố tiền: ${amount.toLocaleString('vi-VN')} VNĐ\nNgân hàng: ${bankName}\nSố TK: ${accountNumber}\nChủ TK: ${accountName}`,
                'admin_new_withdrawal',
                withdrawalRequest.id,
                '/admin/withdrawals'
            );
        }

        res.json({
            success: true,
            message: 'Yêu cầu rút tiền đã được gửi thành công. Admin sẽ xử lý trong 7-10 ngày làm việc.',
            data: withdrawalRequest
        });
    } catch (error) {
        console.error('[WITHDRAW] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể gửi yêu cầu rút tiền'
        });
    }
};

/**
 * @route   GET /api/credits/withdrawals
 * @desc    Lấy danh sách yêu cầu rút tiền của user
 * @access  Private
 */
exports.getMyWithdrawals = async (req, res) => {
    try {
        const userId = req.user.id;

        const withdrawals = await UserCredit.getUserWithdrawals(userId);

        res.json({
            success: true,
            data: withdrawals
        });
    } catch (error) {
        console.error('[GET MY WITHDRAWALS] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách yêu cầu rút tiền'
        });
    }
};

/**
 * =============================================
 * ADMIN WITHDRAWAL MANAGEMENT
 * =============================================
 */

/**
 * @route   GET /api/credits/admin/withdrawals
 * @desc    Lấy tất cả yêu cầu rút tiền (Admin)
 * @access  Admin
 */
exports.adminGetAllWithdrawals = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            page: req.query.page || 1,
            limit: req.query.limit || 20
        };

        const result = await UserCredit.getAllWithdrawals(filters);

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('[ADMIN GET ALL WITHDRAWALS] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách yêu cầu rút tiền'
        });
    }
};

/**
 * @route   GET /api/credits/admin/withdrawals/:id
 * @desc    Lấy chi tiết yêu cầu rút tiền (Admin)
 * @access  Admin
 */
exports.adminGetWithdrawalById = async (req, res) => {
    try {
        const { id } = req.params;

        const withdrawal = await UserCredit.getWithdrawalById(id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu rút tiền'
            });
        }

        res.json({
            success: true,
            data: withdrawal
        });
    } catch (error) {
        console.error('[ADMIN GET WITHDRAWAL BY ID] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thông tin yêu cầu rút tiền'
        });
    }
};

/**
 * @route   PUT /api/credits/admin/withdrawals/:id/approve
 * @desc    Duyệt yêu cầu rút tiền (Admin)
 * @access  Admin
 */
exports.adminApproveWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_note } = req.body;

        // Lấy thông tin withdrawal
        const withdrawal = await UserCredit.getWithdrawalById(id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu rút tiền'
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu đã được xử lý'
            });
        }

        // Duyệt withdrawal
        await UserCredit.approveWithdrawal(id, admin_note);

        // ✅ GỬI THÔNG BÁO CHO USER
        const io = req.app.get('io');
        const NotificationService = require('../utils/notificationService');
        
        await NotificationService.notifyWithdrawalApproved(
            io,
            withdrawal.user_id,
            id,
            withdrawal.amount,
            withdrawal.bank_name
        );

        res.json({
            success: true,
            message: 'Đã duyệt yêu cầu rút tiền thành công'
        });
    } catch (error) {
        console.error('[ADMIN APPROVE WITHDRAWAL] Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Không thể duyệt yêu cầu rút tiền'
        });
    }
};

/**
 * @route   PUT /api/credits/admin/withdrawals/:id/reject
 * @desc    Từ chối yêu cầu rút tiền (Admin)
 * @access  Admin
 */
exports.adminRejectWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_note } = req.body;

        if (!admin_note) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập lý do từ chối'
            });
        }

        // Lấy thông tin withdrawal
        const withdrawal = await UserCredit.getWithdrawalById(id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu rút tiền'
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu đã được xử lý'
            });
        }

        // Từ chối withdrawal
        await UserCredit.rejectWithdrawal(id, admin_note);

        // ✅ GỬI THÔNG BÁO CHO USER
        const io = req.app.get('io');
        const NotificationService = require('../utils/notificationService');
        
        await NotificationService.notifyWithdrawalRejected(
            io,
            withdrawal.user_id,
            id,
            withdrawal.amount,
            admin_note
        );

        res.json({
            success: true,
            message: 'Đã từ chối yêu cầu rút tiền'
        });
    } catch (error) {
        console.error('[ADMIN REJECT WITHDRAWAL] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể từ chối yêu cầu rút tiền'
        });
    }
};

/**
 * @route   PUT /api/credits/admin/withdrawals/:id/complete
 * @desc    Đánh dấu đã chuyển tiền (Admin)
 * @access  Admin
 */
exports.adminCompleteWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { transaction_ref } = req.body;

        // Lấy thông tin withdrawal
        const withdrawal = await UserCredit.getWithdrawalById(id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu rút tiền'
            });
        }

        if (withdrawal.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể đánh dấu hoàn thành cho yêu cầu đã được duyệt'
            });
        }

        // Đánh dấu hoàn thành
        await UserCredit.completeWithdrawal(id, transaction_ref);

        // ✅ GỬI THÔNG BÁO CHO USER
        const io = req.app.get('io');
        const NotificationService = require('../utils/notificationService');
        
        await NotificationService.notifyWithdrawalCompleted(
            io,
            withdrawal.user_id,
            id,
            withdrawal.amount,
            withdrawal.bank_name,
            transaction_ref
        );

        res.json({
            success: true,
            message: 'Đã đánh dấu hoàn thành chuyển tiền'
        });
    } catch (error) {
        console.error('[ADMIN COMPLETE WITHDRAWAL] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể cập nhật trạng thái'
        });
    }
};

/**
 * @route   GET /api/credits/admin/withdrawals/stats
 * @desc    Lấy thống kê rút tiền (Admin)
 * @access  Admin
 */
exports.adminGetWithdrawalStats = async (req, res) => {
    try {
        const stats = await UserCredit.getWithdrawalStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('[ADMIN GET WITHDRAWAL STATS] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thống kê rút tiền'
        });
    }
};