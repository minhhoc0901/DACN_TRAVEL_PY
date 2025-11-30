const { pool } = require('../config/db');

class UserCredit {
    /**
     * Lấy số dư credit của user
     */
    static async getBalance(userId) {
        const [rows] = await pool.query(
            'SELECT amount FROM user_credits WHERE user_id = ?',
            [userId]
        );
        return rows[0]?.amount || 0;
    }

    /**
     * Cộng credit cho user (từ refund)
     */
    static async addCredit(userId, amount, refundId, description) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Cộng credit
            await connection.query(
                `INSERT INTO user_credits (user_id, amount) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE amount = amount + ?`,
                [userId, amount, amount]
            );

            // 2. Lấy balance mới
            const [rows] = await connection.query(
                'SELECT amount FROM user_credits WHERE user_id = ?',
                [userId]
            );
            const newBalance = rows[0].amount;

            // 3. Ghi log transaction
            await connection.query(
                `INSERT INTO credit_transactions 
                 (user_id, transaction_type, amount, balance_after, related_id, description)
                 VALUES (?, 'refund', ?, ?, ?, ?)`,
                [userId, amount, newBalance, refundId, description]
            );

            await connection.commit();
            return newBalance;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Trừ credit khi user dùng để thanh toán
     */
    static async deductCredit(userId, amount, bookingId, description) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Kiểm tra số dư
            const [balance] = await connection.query(
                'SELECT amount FROM user_credits WHERE user_id = ? FOR UPDATE',
                [userId]
            );

            if (balance.length === 0) {
                throw new Error('Tài khoản Credit không tồn tại');
            }

            const currentBalance = parseFloat(balance[0].amount);
            if (currentBalance < amount) {
                throw new Error('Số dư không đủ');
            }

            // 2. Trừ tiền
            await connection.query(
                'UPDATE user_credits SET amount = amount - ? WHERE user_id = ?',
                [amount, userId]
            );

            // 3. Ghi log transaction
            await connection.query(
                `INSERT INTO credit_transactions 
                 (user_id, transaction_type, amount, balance_after, related_id, description)
                 VALUES (?, 'payment', ?, ?, ?, ?)`,
                [userId, -amount, currentBalance - amount, bookingId, description]
            );

            await connection.commit();

            console.log(`[UserCredit] Deducted ${amount} from user ${userId} for booking ${bookingId}`);

            return {
                success: true,
                previousBalance: currentBalance,
                newBalance: currentBalance - amount
            };

        } catch (error) {
            await connection.rollback();
            console.error('[UserCredit] deductCredit Error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Lấy lịch sử giao dịch credit
     */
    static async getTransactionHistory(userId, limit = 20) {
        const [rows] = await pool.query(
            `SELECT * FROM credit_transactions 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [userId, limit]
        );
        return rows;
    }

    /**
     * ✅ TẠO YÊU CẦU RÚT TIỀN
     */
    static async createWithdrawalRequest(userId, amount, bankName, accountNumber, accountName) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Tạo yêu cầu rút tiền
            const [result] = await connection.query(
                `INSERT INTO withdrawal_requests 
                 (user_id, amount, bank_name, account_number, account_name, status) 
                 VALUES (?, ?, ?, ?, ?, 'pending')`,
                [userId, amount, bankName, accountNumber, accountName]
            );

            const withdrawalId = result.insertId;

            // 2. Ghi log transaction
            await connection.query(
                `INSERT INTO credit_transactions 
                 (user_id, transaction_type, amount, balance_after, related_id, description)
                 VALUES (?, 'withdrawal', ?, (SELECT amount FROM user_credits WHERE user_id = ?), ?, ?)`,
                [userId, -amount, userId, withdrawalId, `Yêu cầu rút tiền #${withdrawalId}`]
            );

            await connection.commit();

            return {
                id: withdrawalId,
                user_id: userId,
                amount,
                bank_name: bankName,
                account_number: accountNumber,
                account_name: accountName,
                status: 'pending'
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * ✅ LẤY DANH SÁCH YÊU CẦU RÚT TIỀN CỦA USER
     */
    static async getUserWithdrawals(userId) {
        const [rows] = await pool.query(
            `SELECT * FROM withdrawal_requests 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [userId]
        );
        return rows;
    }

    /**
     * ✅ ADMIN DUYỆT YÊU CẦU RÚT TIỀN
     */
    static async approveWithdrawal(withdrawalId, adminNote = '') {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Lấy thông tin withdrawal
            const [withdrawal] = await connection.query(
                'SELECT * FROM withdrawal_requests WHERE id = ?',
                [withdrawalId]
            );

            if (withdrawal.length === 0) {
                throw new Error('Không tìm thấy yêu cầu rút tiền');
            }

            if (withdrawal[0].status !== 'pending') {
                throw new Error('Yêu cầu đã được xử lý');
            }

            const { user_id, amount } = withdrawal[0];

            // 2. ✅ SỬA: Kiểm tra số dư SAU KHI TRỪ tất cả withdrawal pending
            const balance = await this.getBalance(user_id);
            
            // Tính tổng số tiền đang chờ rút (KHÔNG BAO GỒM withdrawal này)
            const [pendingWithdrawals] = await connection.query(
                `SELECT COALESCE(SUM(amount), 0) as total_pending
                 FROM withdrawal_requests 
                 WHERE user_id = ? AND status = 'pending' AND id != ?`,
                [user_id, withdrawalId]
            );
            
            const totalPending = pendingWithdrawals[0].total_pending || 0;
            const availableBalance = balance - totalPending;

            console.log(`[approveWithdrawal] User ${user_id}:`);
            console.log(`  - Current balance: ${balance}`);
            console.log(`  - Other pending withdrawals: ${totalPending}`);
            console.log(`  - Available balance: ${availableBalance}`);
            console.log(`  - Withdrawal amount: ${amount}`);

            if (availableBalance < amount) {
                throw new Error(`Số dư không đủ. Số dư khả dụng: ${availableBalance.toLocaleString('vi-VN')} VNĐ`);
            }

            // 3. Trừ credit
            await connection.query(
                'UPDATE user_credits SET amount = amount - ? WHERE user_id = ?',
                [amount, user_id]
            );

            // 4. Cập nhật trạng thái withdrawal
            await connection.query(
                `UPDATE withdrawal_requests 
                 SET status = 'approved', admin_note = ?, processed_at = NOW() 
                 WHERE id = ?`,
                [adminNote, withdrawalId]
            );

            await connection.commit();

            console.log(`[approveWithdrawal] ✅ Approved withdrawal #${withdrawalId} for user ${user_id}`);

            return {
                success: true,
                message: 'Đã duyệt yêu cầu rút tiền'
            };

        } catch (error) {
            await connection.rollback();
            console.error('[approveWithdrawal] Error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * ✅ ADMIN TỪ CHỐI YÊU CẦU RÚT TIỀN
     */
    static async rejectWithdrawal(withdrawalId, adminNote = '') {
        await pool.query(
            `UPDATE withdrawal_requests 
             SET status = 'rejected', admin_note = ?, processed_at = NOW() 
             WHERE id = ?`,
            [adminNote, withdrawalId]
        );

        return {
            success: true,
            message: 'Đã từ chối yêu cầu rút tiền'
        };
    }

    /**
     * ✅ ADMIN LẤY TẤT CẢ YÊU CẦU RÚT TIỀN
     */
    static async getAllWithdrawals(filters = {}) {
        const { status, page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;

        let whereClause = '';
        const params = [];

        if (status) {
            whereClause = 'WHERE wr.status = ?';
            params.push(status);
        }

        const query = `
            SELECT 
                wr.*,
                u.username,
                u.email,
                u.full_name,
                uc.amount as user_balance
            FROM withdrawal_requests wr
            LEFT JOIN users u ON wr.user_id = u.id
            LEFT JOIN user_credits uc ON wr.user_id = uc.user_id
            ${whereClause}
            ORDER BY wr.created_at DESC
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(query, params);

        // Đếm tổng số
        const countQuery = `
            SELECT COUNT(*) as total
            FROM withdrawal_requests wr
            ${whereClause}
        `;
        const [countResult] = await pool.query(countQuery, status ? [status] : []);

        return {
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        };
    }

    /**
     * ✅ ADMIN LẤY CHI TIẾT MỘT YÊU CẦU RÚT TIỀN
     */
    static async getWithdrawalById(withdrawalId) {
        const [rows] = await pool.query(
            `SELECT 
                wr.*,
                u.id as user_id,
                u.username,
                u.email,
                u.full_name,
                u.phone,
                uc.amount as user_balance
             FROM withdrawal_requests wr
             LEFT JOIN users u ON wr.user_id = u.id
             LEFT JOIN user_credits uc ON wr.user_id = uc.user_id
             WHERE wr.id = ?`,
            [withdrawalId]
        );

        return rows[0] || null;
    }

    /**
     * ✅ ADMIN ĐÁNH DẤU ĐÃ CHUYỂN TIỀN
     */
    static async completeWithdrawal(withdrawalId, transactionRef) {
        await pool.query(
            `UPDATE withdrawal_requests 
             SET status = 'completed', 
                 transaction_ref = ?,
                 completed_at = NOW() 
             WHERE id = ? AND status = 'approved'`,
            [transactionRef, withdrawalId]
        );

        return {
            success: true,
            message: 'Đã đánh dấu hoàn thành chuyển tiền'
        };
    }

    /**
     * ✅ ADMIN LẤY THỐNG KÊ RÚT TIỀN
     */
    static async getWithdrawalStats() {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
                SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount
            FROM withdrawal_requests
        `);

        return stats[0];
    }
}

module.exports = UserCredit;