const { pool } = require('../config/db');
const UserCredit = require('./UserCredit');
const TourDeparture = require('./TourDeparture');

class Refund {
  /**
   * [ADMIN] DUYỆT YÊU CẦU HOÀN TIỀN
   */
  static async approveRefund(refundId, adminId, adminNote = '') {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Lấy thông tin refund
      const [refunds] = await connection.query(`
        SELECT 
          r.*,
          b.user_id,
          b.tour_departure_id,
          b.status as booking_status,
          t.destination as tour_name,
          (SELECT SUM(quantity) FROM booking_details WHERE booking_id = r.booking_id) as total_guests
        FROM refunds r
        JOIN bookings b ON r.booking_id = b.id
        LEFT JOIN tours t ON b.tour_id = t.id
        WHERE r.id = ? AND r.refund_status = 'pending'
        FOR UPDATE
      `, [refundId]);

      if (!refunds || refunds.length === 0) {
        throw new Error('Không tìm thấy yêu cầu hoàn tiền hoặc đã được xử lý');
      }

      const refund = refunds[0];

      console.log(`[approveRefund] Processing refund #${refundId}, booking #${refund.booking_id}`);

      // 2. Xử lý hoàn tiền theo phương thức
      if (refund.refund_method === 'credit') {
        // HOÀN VÀO CREDIT NGAY
        await UserCredit.addCredit(
          refund.user_id,
          refund.refund_amount,
          refundId,
          `Hoàn tiền từ hủy booking #${refund.booking_id}`,
          connection
        );

        // Cập nhật refund status
        await connection.execute(
          `UPDATE refunds 
           SET refund_status = 'approved', processed_by = ?, admin_notes = ?, processed_at = NOW(), approved_at = NOW()
           WHERE id = ?`,
          [adminId, adminNote, refundId]
        );

        console.log(`[approveRefund] ✅ Credited ${refund.refund_amount} VNĐ to user ${refund.user_id}`);

      } else if (refund.refund_method === 'bank_transfer') {
        // ĐÁNH DẤU ĐANG XỬ LÝ (admin sẽ chuyển khoản thủ công)
        await connection.execute(
          `UPDATE refunds 
           SET refund_status = 'processing', processed_by = ?, admin_notes = ?, processed_at = NOW()
           WHERE id = ?`,
          [adminId, adminNote, refundId]
        );

        console.log(`[approveRefund] ⏳ Bank transfer marked as processing for user ${refund.user_id}`);
      }

      // 3. CẬP NHẬT BOOKING STATUS = 'cancelled'
      await connection.execute(
        'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
        ['cancelled', refund.booking_id]
      );

      // 4. HOÀN TRẢ SLOTS
      if (refund.tour_departure_id && refund.total_guests > 0) {
        await TourDeparture.restoreSlots(
          refund.tour_departure_id,
          refund.total_guests,
          connection
        );
      }

      await connection.commit();

      return {
        success: true,
        message: refund.refund_method === 'credit' 
          ? 'Đã duyệt và hoàn tiền vào Credit của user'
          : 'Đã duyệt. Vui lòng chuyển khoản cho user.',
        refund: {
          ...refund,
          refund_status: refund.refund_method === 'credit' ? 'approved' : 'processing'
        }
      };

    } catch (error) {
      await connection.rollback();
      console.error('[approveRefund] Error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * ✅ [ADMIN] TỪ CHỐI YÊU CẦU HOÀN TIỀN
   */
  static async rejectRefund(refundId, adminId, adminNote = '') {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Lấy thông tin refund
      const [refunds] = await connection.query(`
        SELECT 
          r.*,
          b.user_id,
          b.status as booking_status,
          t.destination as tour_name
        FROM refunds r
        JOIN bookings b ON r.booking_id = b.id
        LEFT JOIN tours t ON b.tour_id = t.id
        WHERE r.id = ? AND r.refund_status = 'pending'
        FOR UPDATE
      `, [refundId]);

      if (!refunds || refunds.length === 0) {
        throw new Error('Không tìm thấy yêu cầu hoàn tiền hoặc đã được xử lý');
      }

      const refund = refunds[0];

      // 2. KHÔI PHỤC BOOKING STATUS = 'confirmed'
      await connection.execute(
        'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
        ['confirmed', refund.booking_id]
      );

      // 3. Cập nhật refund status
      await connection.execute(
        `UPDATE refunds 
         SET refund_status = 'rejected', processed_by = ?, admin_notes = ?, processed_at = NOW()
         WHERE id = ?`,
        [adminId, adminNote, refundId]
      );

      await connection.commit();

      console.log(`[rejectRefund] ❌ Rejected refund #${refundId}, booking #${refund.booking_id} restored`);

      return {
        success: true,
        message: 'Đã từ chối yêu cầu hoàn tiền. Booking đã được khôi phục.',
        refund: {
          ...refund,
          refund_status: 'rejected'
        }
      };

    } catch (error) {
      await connection.rollback();
      console.error('[rejectRefund] Error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   *  [ADMIN] Lấy danh sách refund
   */
  static async getAll(filters = {}) {
    const { status, page = 1, limit = 20, search } = filters;
    
    // CONVERT SANG INTEGER
    const pageInt = parseInt(page, 10) || 1;
    const limitInt = parseInt(limit, 10) || 20;
    const offset = (pageInt - 1) * limitInt;

    let whereConditions = [];
    const params = [];

    if (status) {
      whereConditions.push('r.refund_status = ?');
      params.push(status);
    }

    if (search) {
      whereConditions.push('(r.booking_id = ? OR t.destination LIKE ? OR b.contact_name LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(search, searchParam, searchParam);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Count
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM refunds r
      JOIN bookings b ON r.booking_id = b.id
      LEFT JOIN tours t ON b.tour_id = t.id
      ${whereClause}
    `, params);

    const total = countResult[0].total;

    // Data - SỬ DỤNG limitInt và offset 
    const [refunds] = await pool.query(`
      SELECT 
        r.*,
        b.user_id,
        b.contact_name,
        b.contact_email,
        b.contact_phone,
        b.status as booking_status,
        b.final_amount as booking_amount,
        t.id as tour_id,
        t.destination as tour_name,
        t.image as tour_image,
        td.departure_date,
        u.username,
        u.full_name,
        admin.username as processed_by_username
      FROM refunds r
      JOIN bookings b ON r.booking_id = b.id
      LEFT JOIN tours t ON b.tour_id = t.id
      LEFT JOIN tour_departures td ON b.tour_departure_id = td.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN users admin ON r.processed_by = admin.id
      ${whereClause}
      ORDER BY 
        CASE r.refund_status
          WHEN 'pending' THEN 1
          WHEN 'processing' THEN 2
          WHEN 'approved' THEN 3
          WHEN 'rejected' THEN 4
        END,
        r.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limitInt, offset]);

    return {
      refunds,
      pagination: {
        total,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt)
      }
    };
  }

  /**
   * ✅ [USER] Lấy danh sách refund của user
   */
  static async getUserRefunds(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    // ✅ CONVERT SANG INTEGER
    const pageInt = parseInt(page, 10) || 1;
    const limitInt = parseInt(limit, 10) || 20;
    const offset = (pageInt - 1) * limitInt;

    // Count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM refunds r JOIN bookings b ON r.booking_id = b.id WHERE b.user_id = ?',
      [userId]
    );

    const total = countResult[0].total;

    // Data
    const [refunds] = await pool.query(`
      SELECT 
        r.*,
        b.contact_name,
        b.status as booking_status,
        b.final_amount as booking_amount,
        t.id as tour_id,
        t.destination as tour_name,
        t.image as tour_image,
        td.departure_date
      FROM refunds r
      JOIN bookings b ON r.booking_id = b.id
      LEFT JOIN tours t ON b.tour_id = t.id
      LEFT JOIN tour_departures td ON b.tour_departure_id = td.id
      WHERE b.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limitInt, offset]);
    return {
      refunds,
      pagination: {
        total,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt)
      }
    };
  }

  /**
   * ✅ Lấy chi tiết refund
   */
  static async getById(refundId) {
    const [refunds] = await pool.query(`
      SELECT 
        r.*,
        b.user_id,
        b.contact_name,
        b.contact_email,
        b.contact_phone,
        b.special_requests,
        b.status as booking_status,
        b.final_amount as booking_amount,
        b.created_at as booking_created_at,
        t.id as tour_id,
        t.destination as tour_name,
        t.image as tour_image,
        t.duration,
        td.departure_date,
        td.end_date,
        u.username,
        u.full_name,
        u.email as user_email,
        u.phone as user_phone,
        admin.username as processed_by_username,
        admin.full_name as processed_by_fullname,
        (SELECT GROUP_CONCAT(
          JSON_OBJECT(
            'price_type', bd.price_type,
            'quantity', bd.quantity,
            'unit_price', bd.unit_price,
            'subtotal', bd.subtotal
          )
        ) FROM booking_details bd WHERE bd.booking_id = r.booking_id) as booking_details
      FROM refunds r
      JOIN bookings b ON r.booking_id = b.id
      LEFT JOIN tours t ON b.tour_id = t.id
      LEFT JOIN tour_departures td ON b.tour_departure_id = td.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN users admin ON r.processed_by = admin.id
      WHERE r.id = ?
    `, [refundId]);

    if (!refunds || refunds.length === 0) {
      return null;
    }

    const refund = refunds[0];
    refund.booking_details = refund.booking_details 
      ? JSON.parse(`[${refund.booking_details}]`) 
      : [];

    return refund;
  }

  /**
   * ✅ Thống kê refund
   */
  static async getStats() {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_refunds,
        COUNT(CASE WHEN refund_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN refund_status = 'processing' THEN 1 END) as processing_count,
        COUNT(CASE WHEN refund_status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN refund_status = 'rejected' THEN 1 END) as rejected_count,
        COALESCE(SUM(refund_amount), 0) as total_refund_amount,
        COALESCE(SUM(CASE WHEN refund_status IN ('approved', 'processing') THEN refund_amount ELSE 0 END), 0) as approved_amount,
        COALESCE(SUM(CASE WHEN refund_status = 'pending' THEN refund_amount ELSE 0 END), 0) as pending_amount,
        COALESCE(AVG(refund_amount), 0) as avg_refund_amount,
        COUNT(CASE WHEN refund_method = 'credit' THEN 1 END) as credit_refunds,
        COUNT(CASE WHEN refund_method = 'bank_transfer' THEN 1 END) as bank_refunds,
        COALESCE(SUM(processing_fee), 0) as total_processing_fees
      FROM refunds
    `);

    return stats[0];
  }

  /**
   * ✅ [ADMIN] Hoàn thành bank transfer
   */
  static async completeBankTransfer(refundId, adminId, transactionRef = '') {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      await connection.execute(
        `UPDATE refunds 
         SET refund_status = 'approved', admin_notes = CONCAT(IFNULL(admin_notes, ''), '\nMã GD: ', ?), approved_at = NOW()
         WHERE id = ? AND refund_status = 'processing'`,
        [transactionRef, refundId]
      );

      await connection.commit();

      return { success: true, message: 'Đã hoàn thành chuyển khoản' };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Refund;