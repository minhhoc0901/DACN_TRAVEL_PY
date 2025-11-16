const { pool } = require("../config/db");
const Notification = require('./Notification');
const NOTIFICATION_TYPES = require('../constants/notificationTypes');
const BookingDetail = require("./BookingDetail");
const TourDeparture = require("./TourDeparture");
const crypto = require('crypto');

class Booking {
  static async create(
    conn,
    {
      userId,
      tourId,
      tour_departure_id,
      originalAmount,
      finalAmount,
      discountAmount,
      promotionId,
      contact,
    }
  ) {

    // Sinh token ngẫu nhiên
    const verificationToken = crypto.randomBytes(20).toString('hex');

    const [res] = await conn.query(
      `INSERT INTO Bookings
             (user_id, tour_id, tour_departure_id, original_amount, final_amount, discount_amount,
              promotion_id, contact_name, contact_email, contact_phone, special_requests, verification_token)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        userId,
        tourId,
        tour_departure_id,
        originalAmount,
        finalAmount,
        discountAmount,
        promotionId || null,
        contact.name,
        contact.email,
        contact.phone,
        contact.special || null,
        verificationToken
      ]
    );
    return res.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM Bookings WHERE id=?`, [id]);
    return rows[0] || null;
  }

  static async updateStatus(bookingId, status, connection = pool) {
    await connection.execute(
      `UPDATE Bookings SET status = ? WHERE id = ?`,
      [status, bookingId]
    );
  }
  static async findByUser(userId) {
    const [rows] = await pool.query(
      `SELECT 
                b.*, 
                t.destination AS tour_name, 
                t.image AS tour_image,
                latest_payment.payment_status,
                (SELECT GROUP_CONCAT(
                    JSON_OBJECT(
                        'price_type', bd.price_type, 
                        'quantity', bd.quantity, 
                        'unit_price', bd.unit_price
                    )
                ) 
                FROM booking_details bd 
                WHERE bd.booking_id = b.id
                ) AS details
            FROM 
                bookings b
            JOIN 
                tours t ON b.tour_id = t.id
            LEFT JOIN 
                (
                    SELECT 
                        booking_id, 
                        payment_status,
                        ROW_NUMBER() OVER(PARTITION BY booking_id ORDER BY updated_at DESC) as rn
                    FROM 
                        payments
                ) AS latest_payment ON b.id = latest_payment.booking_id AND latest_payment.rn = 1
            WHERE 
                b.user_id = ? AND b.is_hidden = 0
            ORDER BY 
                b.created_at DESC`,
      [userId]
    );

    // Chuyển đổi chuỗi JSON 'details' thành một mảng object
    return rows.map((row) => ({
      ...row,
      details: row.details ? JSON.parse(`[${row.details}]`) : [],
    }));
  }
  /**
     * Tìm một booking bằng ID và khóa nó để cập nhật trong transaction.
     * Hàm này cũng lấy luôn các chi tiết (BookingDetails) đi kèm.
     * @param {number} bookingId - ID của booking.
     * @param {number} userId - ID của người dùng để xác thực quyền.
     * @param {object} connection - Đối tượng connection từ transaction.
     * @returns {Promise<object|null>} - Trả về object booking đầy đủ hoặc null.
     */
  static async findByIdForUpdate(bookingId, userId, connection) {
    const [rows] = await connection.execute(
      `SELECT * FROM Bookings WHERE id = ? AND user_id = ? FOR UPDATE`,
      [bookingId, userId]
    );

    if (rows.length === 0) {
      return null;
    }

    const booking = rows[0];
    // Lấy các chi tiết của booking để tính tổng số vé
    booking.BookingDetails = await BookingDetail.findByBooking(bookingId, connection);
    return booking;
  }
  static async deleteByUser(bookingId, userId) {
    // ON DELETE CASCADE sẽ tự động xóa các bản ghi liên quan trong
    // booking_details và payments.
    const [result] = await pool.query(
      `DELETE FROM bookings 
             WHERE id = ? AND user_id = ? AND status != 'confirmed'`,
      [bookingId, userId]
    );
    return result.affectedRows;
  }

  static async hideCancelledBooking(bookingId, userId) {
        const sql = `
            UPDATE Bookings 
            SET is_hidden = 1 
            WHERE id = ? AND user_id = ? AND status = 'cancelled'
        `;
        const [result] = await pool.execute(sql, [bookingId, userId]);
        return result.affectedRows;
    }

  // lấy thông tin để tạo hóa đơn
  
 static async findByPk(id) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `
        SELECT 
          b.*, 
          t.destination AS tour_name, 
          u.full_name AS user_name, 
          u.email AS user_email,
      
          d.departure_date,
          p.code AS promotion_code,
          latest_payment.payment_status,
          latest_payment.payment_method,
          latest_payment.paid_at
        FROM Bookings b
        LEFT JOIN Tours t ON b.tour_id = t.id
        LEFT JOIN Users u ON b.user_id = u.id
        LEFT JOIN Tour_Departures d ON b.tour_departure_id = d.id
        LEFT JOIN Promotions p ON b.promotion_id = p.id
        LEFT JOIN 
        (
          -- Subquery này dùng để lấy bản ghi thanh toán gần nhất cho mỗi booking
          SELECT 
            booking_id, 
            payment_status,
            payment_method,
            updated_at as paid_at,
            ROW_NUMBER() OVER(PARTITION BY booking_id ORDER BY updated_at DESC) as rn
          FROM payments
        ) AS latest_payment ON b.id = latest_payment.booking_id AND latest_payment.rn = 1
        WHERE b.id = ?
        `,
        [id]
      );

      if (rows.length === 0) {
        return null;
      }
      const booking = rows[0];

      // Lấy các chi tiết của đơn hàng (số lượng người lớn, trẻ em...)
      const [details] = await conn.query(
        `
        SELECT * FROM Booking_Details WHERE booking_id = ?
        `,
        [id]
      );
      booking.BookingDetails = details;
      return booking;
      
      return booking;
    } finally {
      conn.release();
    }
  }

  
  // Hủy các booking quá hạn thanh toán và gửi thông báo
  static async cancelExpiredBookings() {
    // Lấy danh sách các đơn hàng hết hạn trước, không cần transaction ở đây.
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const [expiredBookings] = await pool.query(
      `SELECT b.id, b.user_id, b.tour_departure_id, SUM(bd.quantity) as total_slots
       FROM Bookings b
       JOIN booking_details bd ON b.id = bd.booking_id
       WHERE b.status = 'pending_payment' AND b.created_at < ?
       GROUP BY b.id, b.user_id, b.tour_departure_id`,
      [fifteenMinutesAgo]
    );

    if (expiredBookings.length === 0) {
      console.log('[CRON] No expired bookings to cancel.');
      return 0;
    }

    console.log(`[CRON] Found ${expiredBookings.length} expired bookings. Starting cancellation process...`);
    let successCount = 0;

    // Vòng lặp qua các đơn hàng hết hạn
    for (const booking of expiredBookings) {
      // BẮT ĐẦU MỘT TRANSACTION NHỎ CHO MỖI ĐƠN HÀNG
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // Hoàn trả vé
        await TourDeparture.restoreSlots(booking.tour_departure_id, booking.total_slots, conn);
        
        // Cập nhật trạng thái booking
        await Booking.updateStatus(booking.id, 'cancelled', conn);

        // // Tạo thông báo
        // await Notification.createNotificationWithType({ // Đảm bảo tên hàm là "create"
        //   user_id: booking.user_id,
        //   message: `Đơn đặt tour #${booking.id} của bạn đã bị hủy do quá hạn thanh toán.`,
        //   type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
        //   related_id: booking.id,
        //   action_url: `/profile/my-bookings`
        // }, conn);

        await conn.commit(); // Commit transaction nhỏ này
        successCount++;
        console.log(`[CRON] Successfully cancelled booking #${booking.id}.`);

      } catch (error) {
        await conn.rollback();
        // Nếu một đơn hàng bị lỗi (ví dụ: lock timeout), chỉ log lỗi và tiếp tục với đơn hàng tiếp theo
        console.error(`[CRON] Error cancelling booking #${booking.id}:`, error.message);
      } finally {
        conn.release(); // Luôn trả connection về pool
      }
    }

    console.log(`[CRON] Finished. Successfully cancelled ${successCount} out of ${expiredBookings.length} bookings.`);
    return successCount;
  }

  // Tìm booking bằng token xác thực
  static async findByVerificationToken(token) {
        // Dùng lại hàm findByPk để lấy đầy đủ thông tin
        const [rows] = await pool.query(`SELECT id FROM Bookings WHERE verification_token = ?`, [token]);
        if (rows.length === 0) {
            return null;
        }
        // Gọi hàm findByPk đã có để lấy tất cả thông tin chi tiết
        return this.findByPk(rows[0].id);
    }
}

module.exports = Booking;
