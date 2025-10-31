
const { pool } = require('../config/db');

class Payment {
  /**
   * Tạo payment mới với trạng thái pending
   */
  static async createPending(bookingId, txnRef, amount) {
    try {
      const [result] = await pool.query(
        `INSERT INTO payments (booking_id, vnp_TxnRef, amount, payment_method, payment_status, payment_date)
         VALUES (?, ?, ?, 'VNPAY', 'pending', NOW())`,
        [bookingId, txnRef, amount]
      );
      console.log('[Payment][createPending] Created payment with ID:', result.insertId);
      return result;
    } catch (error) {
      console.error('[Payment][createPending] Error:', error);
      throw error;
    }
  }

  /**
   * Tìm payment theo vnp_TxnRef
   */
  static async findByTxnRef(txnRef) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM payments WHERE vnp_TxnRef = ? LIMIT 1`,
        [txnRef]
      );
      return rows[0];
    } catch (error) {
      console.error('[Payment][findByTxnRef] Error:', error);
      throw error;
    }
  }

  /**
   * Tìm payment thành công theo booking_id
   */
  static async findSuccessfulByBookingId(bookingId) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM payments 
         WHERE booking_id = ? AND payment_status = 'success' 
         ORDER BY payment_date DESC LIMIT 1`,
        [bookingId]
      );
      return rows[0];
    } catch (error) {
      console.error('[Payment][findSuccessfulByBookingId] Error:', error);
      throw error;
    }
  }

  /**
   * Tìm payment pending theo booking_id
   */
  static async findPendingByBookingId(bookingId) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM payments 
         WHERE booking_id = ? AND payment_status = 'pending' 
         ORDER BY payment_date DESC LIMIT 1`,
        [bookingId]
      );
      return rows[0];
    } catch (error) {
      console.error('[Payment][findPendingByBookingId] Error:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả payments theo booking_id
   */
  static async findByBookingId(bookingId) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM payments 
         WHERE booking_id = ? 
         ORDER BY payment_date DESC`,
        [bookingId]
      );
      return rows;
    } catch (error) {
      console.error('[Payment][findByBookingId] Error:', error);
      throw error;
    }
  }

  /**
   * Lấy payment theo ID
   */
  static async findById(paymentId) {
    try {
      const [rows] = await pool.query(
        `SELECT p.*, b.tour_name, b.customer_name, b.customer_email 
         FROM payments p 
         LEFT JOIN bookings b ON p.booking_id = b.id 
         WHERE p.id = ?`,
        [paymentId]
      );
      return rows[0];
    } catch (error) {
      console.error('[Payment][findById] Error:', error);
      throw error;
    }
  }

  /**
   * Đánh dấu payment thành công
   */
  static async markSuccess(txnRef, transactionNo, responseCode) {
    try {
      const [result] = await pool.query(
        `UPDATE payments 
         SET payment_status = 'success', 
             vnp_TransactionNo = ?,
             vnp_ResponseCode = ?,
             updated_at = NOW()
         WHERE vnp_TxnRef = ?`,
        [transactionNo, responseCode, txnRef]
      );
      console.log('[Payment][markSuccess] Updated rows:', result.affectedRows);
      return result;
    } catch (error) {
      console.error('[Payment][markSuccess] Error:', error);
      throw error;
    }
  }

  /**
   * Đánh dấu payment thất bại
   */
  static async markFailed(txnRef, responseCode) {
    try {
      const [result] = await pool.query(
        `UPDATE payments 
         SET payment_status = 'failed',
             vnp_ResponseCode = ?,
             updated_at = NOW()
         WHERE vnp_TxnRef = ?`,
        [responseCode, txnRef]
      );
      console.log('[Payment][markFailed] Updated rows:', result.affectedRows);
      return result;
    } catch (error) {
      console.error('[Payment][markFailed] Error:', error);
      throw error;
    }
  }

  /**
   * Đánh dấu payment hết hạn
   */
  static async markExpired(txnRef) {
    try {
      const [result] = await pool.query(
        `UPDATE payments 
         SET payment_status = 'failed',
             vnp_ResponseCode = 'EXPIRED',
             updated_at = NOW()
         WHERE vnp_TxnRef = ? AND payment_status = 'pending'`,
        [txnRef]
      );
      console.log('[Payment][markExpired] Expired payment:', txnRef);
      return result;
    } catch (error) {
      console.error('[Payment][markExpired] Error:', error);
      throw error;
    }
  }

  /**
   * Thống kê payments theo ngày
   */
  static async getStatsByDate(fromDate, toDate) {
    try {
      let whereClause = '';
      let params = [];
      
      if (fromDate && toDate) {
        whereClause = 'WHERE DATE(payment_date) BETWEEN ? AND ?';
        params = [fromDate, toDate];
      } else if (fromDate) {
        whereClause = 'WHERE DATE(payment_date) >= ?';
        params = [fromDate];
      } else {
        whereClause = 'WHERE payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
      }
      
      const [rows] = await pool.query(`
        SELECT 
          DATE(payment_date) as date,
          payment_status,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM payments 
        ${whereClause}
        GROUP BY DATE(payment_date), payment_status
        ORDER BY date DESC, payment_status
      `, params);
      
      return rows;
    } catch (error) {
      console.error('[Payment][getStatsByDate] Error:', error);
      throw error;
    }
  }

  /**
   * Lấy tổng thống kê payments
   */
  static async getTotalStats() {
    try {
      const [rows] = await pool.query(`
        SELECT 
          payment_status,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount
        FROM payments 
        GROUP BY payment_status
      `);
      return rows;
    } catch (error) {
      console.error('[Payment][getTotalStats] Error:', error);
      throw error;
    }
  }
}

module.exports = Payment;