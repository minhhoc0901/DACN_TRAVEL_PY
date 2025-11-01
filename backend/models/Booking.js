const { pool } = require("../config/db");
const Notification = require('./Notification'); 
const  NOTIFICATION_TYPES = require('../constants/notificationTypes');

class Booking {
  static async create(
    conn,
    {
      userId,
      tourId,
      startDate,
      originalAmount,
      finalAmount,
      discountAmount,
      promotionId,
      contact,
    }
  ) {
    const [res] = await conn.query(
      `INSERT INTO Bookings
             (user_id, tour_id, start_date, original_amount, final_amount, discount_amount,
              promotion_id, contact_name, contact_email, contact_phone, special_requests)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        userId,
        tourId,
        startDate,
        originalAmount,
        finalAmount,
        discountAmount,
        promotionId || null,
        contact.name,
        contact.email,
        contact.phone,
        contact.special || null,
      ]
    );
    return res.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM Bookings WHERE id=?`, [id]);
    return rows[0] || null;
  }

  static async updateStatus(id, status) {
    await pool.query(`UPDATE Bookings SET status=? WHERE id=?`, [status, id]);
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
                b.user_id = ?
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
  static async cancelByUser(bookingId, userId) {
    const [result] = await pool.query(
      `UPDATE bookings 
             SET status = 'cancelled' 
             WHERE id = ? AND user_id = ? AND status = 'pending_payment'`,
      [bookingId, userId]
    );
    return result.affectedRows;
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
          p.code AS promotion_code, -- <-- LẤY MÃ GIẢM GIÁ
          latest_payment.payment_status,
          latest_payment.payment_method -- <-- LẤY PHƯƠNG THỨC TT
        FROM Bookings b
        LEFT JOIN Tours t ON b.tour_id = t.id
        LEFT JOIN Users u ON b.user_id = u.id
        LEFT JOIN Promotions p ON b.promotion_id = p.id
        LEFT JOIN 
        (
        SELECT 
          booking_id, 
          payment_status,
          payment_method,
          ROW_NUMBER() OVER(PARTITION BY booking_id ORDER BY updated_at DESC) as rn
        FROM  payments
        ) AS latest_payment ON b.id = latest_payment.booking_id AND latest_payment.rn = 1
        WHERE b.id = ?
        `,
        [id]
      );
      if (rows.length === 0) return null;
      const booking = rows[0];

      const [details] = await conn.query(
        `
        SELECT * FROM Booking_Details WHERE booking_id = ?
        `,
        [id]
      );
      booking.BookingDetails = details;
      return booking;
    } finally {
      conn.release();
    }
  }
  // Hủy các booking quá hạn thanh toán và gửi thông báo
  static async cancelExpiredBookings() {
        const conn = await pool.getConnection();
        try {
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

            const [expiredBookings] = await conn.query(
                `SELECT id, user_id FROM Bookings WHERE status = 'pending_payment' AND created_at < ?`,
                [fifteenMinutesAgo]
            );

            if (expiredBookings.length === 0) {
                return 0;
            }

            const bookingIds = expiredBookings.map(b => b.id);

            const [updateResult] = await conn.query(
                `UPDATE Bookings SET status = 'cancelled' WHERE id IN (?)`,
                [bookingIds]
            );

            // Tạo thông báo cho người dùng
            const notificationPromises = expiredBookings.map(booking => 
                Notification.create({
                    user_id: booking.user_id,
                    message: `Đơn đặt tour #${booking.id} của bạn đã bị hủy do quá hạn thanh toán.`,
                    type: NOTIFICATION_TYPES.BOOKING_CANCELLED, // Dòng này sẽ không còn lỗi
                    related_id: booking.id,
                    action_url: `/my-bookings`
                })
            );
            await Promise.all(notificationPromises);

            console.log(`[CRON] Cancelled ${updateResult.affectedRows} expired bookings.`);
            return updateResult.affectedRows;
        } catch (error) {
            console.error('[CRON] Error cancelling expired bookings:', error);
        } finally {
            conn.release();
        }
    }

}

module.exports = Booking;
