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
        const query = `
            SELECT 
                ct.id,
                ct.user_id,
                ct.transaction_type,
                ct.amount,
                ct.balance_after,
                ct.related_id,
                ct.description,
                ct.created_at,
                
                wr.id as withdrawal_id,
                wr.status as withdrawal_status,
                wr.bank_name,
                wr.account_number,
                wr.account_name,
                wr.admin_note as admin_notes,
                wr.transaction_ref,
                wr.processed_at,
                wr.completed_at
                
            FROM credit_transactions ct
            LEFT JOIN withdrawal_requests wr 
                ON ct.transaction_type = 'withdrawal' 
                AND ct.related_id = wr.id
            WHERE ct.user_id = ?
            ORDER BY ct.created_at DESC
            LIMIT ?
        `;

        const [rows] = await pool.query(query, [userId, limit]);

        // ormat data để frontend dễ dùng
        return rows.map(tx => ({
            id: tx.id,
            user_id: tx.user_id,
            transaction_type: tx.transaction_type,
            amount: parseFloat(tx.amount),
            balance_after: parseFloat(tx.balance_after),
            related_id: tx.related_id,
            description: tx.description,
            created_at: tx.created_at,
    
            withdrawal_id: tx.withdrawal_id,
            withdrawal_status: tx.withdrawal_status,
            bank_info: tx.withdrawal_id ? {
                bank_name: tx.bank_name,
                account_number: tx.account_number,
                account_name: tx.account_name
            } : null,
            admin_notes: tx.admin_notes,
            transaction_ref: tx.transaction_ref,
            processed_at: tx.processed_at,
            completed_at: tx.completed_at
        }));
    }


    static async createWithdrawalRequest(userId, amount, bankName, accountNumber, accountName) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // 1. Kiểm tra và trừ tiền
            const [balanceRows] = await connection.query(
                'SELECT amount FROM user_credits WHERE user_id = ? FOR UPDATE',
                [userId]
            );

            const currentBalance = balanceRows.length > 0 ? parseFloat(balanceRows[0].amount) : 0;

            if (currentBalance < amount) {
                throw new Error('Số dư không đủ để rút');
            }

            const newBalance = currentBalance - amount;

            // Update hoặc insert balance
            if (balanceRows.length === 0) {
                await connection.query(
                    'INSERT INTO user_credits (user_id, amount) VALUES (?, ?)',
                    [userId, newBalance]
                );
            } else {
                await connection.query(
                    'UPDATE user_credits SET amount = ? WHERE user_id = ?',
                    [newBalance, userId]
                );
            }

            // 2. Tạo withdrawal request
            const [withdrawalResult] = await connection.query(
                `INSERT INTO withdrawal_requests 
                (user_id, amount, bank_name, account_number, account_name, status) 
                VALUES (?, ?, ?, ?, ?, 'pending')`,
                [userId, amount, bankName, accountNumber, accountName]
            );

            const withdrawalId = withdrawalResult.insertId;

            // 3. Tạo credit transaction ghi nhận việc rút tiền
            await connection.query(
                `INSERT INTO credit_transactions 
                (user_id, transaction_type, amount, balance_after, related_id, description) 
                VALUES (?, 'withdrawal', ?, ?, ?, ?)`,
                [
                    userId,
                    -amount, 
                    newBalance,
                    withdrawalId, 
                    `Yêu cầu rút tiền #${withdrawalId}`
                ]
            );

            await connection.commit();

            return {
                id: withdrawalId,
                user_id: userId,
                amount,
                bank_name: bankName,
                account_number: accountNumber,
                account_name: accountName,
                status: 'pending',
                new_balance: newBalance
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * LẤY DANH SÁCH YÊU CẦU RÚT TIỀN CỦA USER
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
     * ADMIN DUYỆT YÊU CẦU RÚT TIỀN
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

            // 2.Kiểm tra số dư SAU KHI TRỪ tất cả withdrawal pending
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


            // 3. Cập nhật trạng thái withdrawal
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
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Lấy thông tin withdrawal
        const [withdrawalRows] = await connection.query(
            'SELECT * FROM withdrawal_requests WHERE id = ? AND status = "pending"',
            [withdrawalId]
        );

        if (withdrawalRows.length === 0) {
            throw new Error('Không tìm thấy yêu cầu rút tiền hoặc đã được xử lý');
        }

        const withdrawal = withdrawalRows[0];
        const { user_id, amount } = withdrawal;

        console.log(`[rejectWithdrawal] Rejecting withdrawal #${withdrawalId} for user ${user_id}, amount: ${amount}`);

        // 2. ✅ HOÀN TIỀN vào ví user
        await connection.query(
            `INSERT INTO user_credits (user_id, amount) 
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE amount = amount + ?`,
            [user_id, amount, amount]
        );

        // 3. ✅ Lấy số dư mới sau khi hoàn tiền
        const [balanceRows] = await connection.query(
            'SELECT amount FROM user_credits WHERE user_id = ?',
            [user_id]
        );
        const newBalance = parseFloat(balanceRows[0].amount);

        // 4. ✅ Tạo credit transaction để ghi nhận việc hoàn tiền
        await connection.query(
            `INSERT INTO credit_transactions 
            (user_id, transaction_type, amount, balance_after, related_id, description) 
            VALUES (?, 'refund', ?, ?, ?, ?)`,
            [
                user_id,
                amount, // ✅ Số dương (hoàn tiền)
                newBalance,
                withdrawalId,
                `Hoàn tiền từ yêu cầu rút tiền #${withdrawalId} bị từ chối`
            ]
        );

        // 5. ✅ Cập nhật trạng thái withdrawal
        await connection.query(
            `UPDATE withdrawal_requests 
             SET status = 'rejected', admin_note = ?, processed_at = NOW() 
             WHERE id = ?`,
            [adminNote, withdrawalId]
        );

        await connection.commit();

        console.log(`[rejectWithdrawal] ✅ Rejected withdrawal #${withdrawalId}, refunded ${amount} to user ${user_id}`);

        return {
            success: true,
            message: 'Đã từ chối yêu cầu rút tiền và hoàn tiền vào ví',
            refunded_amount: amount,
            new_balance: newBalance
        };

    } catch (error) {
        await connection.rollback();
        console.error('[rejectWithdrawal] Error:', error);
        throw error;
    } finally {
        connection.release();
    }
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