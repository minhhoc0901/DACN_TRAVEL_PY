const { pool } = require("../config/db");
const BookingDetail = require("./BookingDetail");
const TourDeparture = require("./TourDeparture");
const crypto = require('crypto');
const UserCredit = require('./UserCredit');
const NotificationService = require('../utils/notificationService'); 

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
  // static async findByUser(userId) {
  //   const [rows] = await pool.query(
  //     `SELECT 
  //               b.*, 
  //               t.destination AS tour_name, 
  //               t.image AS tour_image,
  //               latest_payment.payment_status,
  //               (SELECT GROUP_CONCAT(
  //                   JSON_OBJECT(
  //                       'price_type', bd.price_type, 
  //                       'quantity', bd.quantity, 
  //                       'unit_price', bd.unit_price
  //                   )
  //               ) 
  //               FROM booking_details bd 
  //               WHERE bd.booking_id = b.id
  //               ) AS details
  //           FROM 
  //               bookings b
  //           JOIN 
  //               tours t ON b.tour_id = t.id
  //           LEFT JOIN 
  //               (
  //                   SELECT 
  //                       booking_id, 
  //                       payment_status,
  //                       ROW_NUMBER() OVER(PARTITION BY booking_id ORDER BY updated_at DESC) as rn
  //                   FROM 
  //                       payments
  //               ) AS latest_payment ON b.id = latest_payment.booking_id AND latest_payment.rn = 1
  //           WHERE 
  //               b.user_id = ? AND b.is_hidden = 0
  //           ORDER BY 
  //               b.created_at DESC`,
  //     [userId]
  //   );

  //   // Chuyển đổi chuỗi JSON 'details' thành một mảng object
  //   return rows.map((row) => ({
  //     ...row,
  //     details: row.details ? JSON.parse(`[${row.details}]`) : [],
  //   }));
  // }


  /**
   * LẤY BOOKING KÈM THEO TRẠNG THÁI 'COMPLETED'
   */
  static async findByUser(userId) {
    const [rows] = await pool.query(
      `SELECT 
        b.*, 
        t.destination AS tour_name, 
        t.image AS tour_image,
        t.departure_from,         
        t.duration as tour_duration, 
        td.departure_date,
        td.end_date,               
        td.duration as departure_duration, 
        latest_payment.payment_status,
        latest_payment.payment_method,
        (SELECT GROUP_CONCAT(
            JSON_OBJECT(
                'price_type', bd.price_type, 
                'quantity', bd.quantity, 
                'unit_price', bd.unit_price
            )
        ) 
        FROM booking_details bd 
        WHERE bd.booking_id = b.id
        ) AS details,
        -- Kiểm tra xem có thể hủy không
        CASE 
          WHEN b.status = 'completed' OR b.status = 'cancelled' THEN 0
          WHEN td.departure_date < CURDATE() THEN 0
          ELSE 1
        END as can_cancel,
        -- Tính số ngày còn lại
        DATEDIFF(td.departure_date, CURDATE()) as days_until_departure
      FROM 
        bookings b
      JOIN 
        tours t ON b.tour_id = t.id
      LEFT JOIN
        tour_departures td ON b.tour_departure_id = td.id
      LEFT JOIN 
        (
          SELECT 
            booking_id, 
            payment_status,
            payment_method,
            ROW_NUMBER() OVER(PARTITION BY booking_id ORDER BY updated_at DESC) as rn
          FROM 
            payments
        ) AS latest_payment ON b.id = latest_payment.booking_id AND latest_payment.rn = 1
      WHERE 
        b.user_id = ? AND b.is_hidden = 0
      ORDER BY 
        CASE b.status
          WHEN 'pending_payment' THEN 1
          WHEN 'confirmed' THEN 2
          WHEN 'completed' THEN 3
          WHEN 'cancelled' THEN 4
        END,
        b.created_at DESC`,
      [userId]
    );

    return rows.map(row => ({
      ...row,
      details: row.details ? JSON.parse(`[${row.details}]`) : [],
      can_cancel: row.can_cancel === 1,
      days_until_departure: row.days_until_departure || 0
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
          t.departure_from, 
          t.duration as tour_base_duration ,
          u.full_name AS user_name, 
          u.email AS user_email,
          d.departure_date,
          d.end_date,  
          d.duration as departure_duration,
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

      // Ưu tiên lấy duration từ tour_departures
      booking.duration = booking.departure_duration || booking.tour_base_duration || 'N/A';


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
  static async cancelExpiredBookings(io = null) {
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

        await conn.commit(); // Commit transaction 
        successCount++;
        console.log(`[CRON] Successfully cancelled booking #${booking.id}.`);

        
        // GỬI THÔNG BÁO NGAY LẬP TỨC (NẾU CÓ io)
        if (io) {
          setImmediate(async () => {
            try {
              await NotificationService.notifyBookingExpired(io, booking.user_id, booking.id);
            } catch (err) {
              console.error(`[Cron] Error sending notification for booking #${booking.id}:`, err);
            }
          });
        }


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

  /**
   * ✅ [ADMIN] Lấy tất cả booking với filter và phân trang
   */
  static async getAllForAdmin(filters = {}) {
    const {
      status,
      payment_status,
      page = 1,
      limit = 20,
      search,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['b.is_hidden = 0'];
    const queryParams = [];

    if (status) {
      whereConditions.push('b.status = ?');
      queryParams.push(status);
    }

    if (payment_status) {
      whereConditions.push('latest_payment.payment_status = ?');
      queryParams.push(payment_status);
    }

    if (search) {
      whereConditions.push('(b.id = ? OR b.contact_name LIKE ? OR b.contact_email LIKE ? OR t.destination LIKE ?)');
      const searchParam = `%${search}%`;
      queryParams.push(search, searchParam, searchParam, searchParam);
    }

    if (date_from) {
      whereConditions.push('b.created_at >= ?');
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push('b.created_at <= ?');
      queryParams.push(date_to + ' 23:59:59');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort column
    const allowedSortColumns = ['created_at', 'final_amount', 'status', 'departure_date'];
    const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Query count
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings b
      LEFT JOIN tours t ON b.tour_id = t.id
      LEFT JOIN (
        SELECT 
          booking_id, 
          payment_status,
          ROW_NUMBER() OVER(PARTITION BY booking_id ORDER BY updated_at DESC) as rn
        FROM payments
      ) AS latest_payment ON b.id = latest_payment.booking_id AND latest_payment.rn = 1
      ${whereClause}
    `, queryParams);

    const total = countResult[0].total;

    // Query data
    const dataParams = [...queryParams, parseInt(limit), offset];

    const [bookings] = await pool.query(`
      SELECT 
        b.id,
        b.user_id,
        b.tour_id,
        b.tour_departure_id,
        b.contact_name,
        b.contact_email,
        b.contact_phone,
        b.special_requests,
        b.original_amount,
        b.discount_amount,
        b.final_amount,
        b.status,
        b.promotion_id,
        b.created_at,
        b.updated_at,
        t.destination,
        t.image as tour_image,
        t.duration,
        t.departure_from,
        td.departure_date,
        td.end_date, 
        u.username,
        u.full_name,
        u.email as user_email,
        u.phone as user_phone,
        latest_payment.payment_status,
        latest_payment.payment_method,
        latest_payment.vnp_TransactionNo,
        (SELECT SUM(quantity) FROM booking_details WHERE booking_id = b.id) as total_guests,
        (SELECT GROUP_CONCAT(
          JSON_OBJECT(
            'price_type', bd.price_type,
            'quantity', bd.quantity,
            'unit_price', bd.unit_price,
            'subtotal', bd.subtotal
          )
        ) FROM booking_details bd WHERE bd.booking_id = b.id) as details
      FROM bookings b
      LEFT JOIN tours t ON b.tour_id = t.id
      LEFT JOIN tour_departures td ON b.tour_departure_id = td.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN (
        SELECT 
          booking_id, 
          payment_status,
          payment_method,
          vnp_TransactionNo,
          ROW_NUMBER() OVER(PARTITION BY booking_id ORDER BY updated_at DESC) as rn
        FROM payments
      ) AS latest_payment ON b.id = latest_payment.booking_id AND latest_payment.rn = 1
      ${whereClause}
      ORDER BY ${sortColumn === 'departure_date' ? 'td.departure_date' : 'b.' + sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `, dataParams);

    // Parse JSON details
    const parsedBookings = bookings.map(booking => ({
      ...booking,
      details: booking.details ? JSON.parse(`[${booking.details}]`) : []
    }));

    return {
      bookings: parsedBookings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * ✅ [ADMIN] Lấy thống kê booking
   */
  static async getStats(filters = {}) {
    const { date_from, date_to } = filters;

    let dateCondition = '';
    const params = [];

    if (date_from && date_to) {
      dateCondition = 'AND b.created_at BETWEEN ? AND ?';
      params.push(date_from, date_to + ' 23:59:59');
    }

    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(final_amount) as total_revenue,
        SUM(CASE WHEN status = 'confirmed' THEN final_amount ELSE 0 END) as confirmed_revenue,
        AVG(final_amount) as avg_booking_value
      FROM bookings b
      WHERE is_hidden = 0 ${dateCondition}
    `, params);

    const [paymentStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.booking_id) as paid_bookings,
        SUM(p.amount) as total_paid,
        SUM(CASE WHEN p.payment_status = 'success' THEN 1 ELSE 0 END) as successful_payments,
        SUM(CASE WHEN p.payment_status = 'failed' THEN 1 ELSE 0 END) as failed_payments
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      WHERE b.is_hidden = 0 ${dateCondition}
    `, params);

    const [topTours] = await pool.query(`
      SELECT 
        t.destination,
        COUNT(b.id) as booking_count,
        SUM(b.final_amount) as tour_revenue
      FROM bookings b
      JOIN tours t ON b.tour_id = t.id
      WHERE b.is_hidden = 0 ${dateCondition}
      GROUP BY t.id, t.destination
      ORDER BY booking_count DESC
      LIMIT 5
    `, params);

    const [recentBookings] = await pool.query(`
      SELECT 
        b.id,
        b.contact_name,
        b.final_amount,
        b.status,
        b.created_at,
        t.destination,
        latest_payment.payment_status
      FROM bookings b
      LEFT JOIN tours t ON b.tour_id = t.id
      LEFT JOIN (
        SELECT 
          booking_id, 
          payment_status,
          ROW_NUMBER() OVER(PARTITION BY booking_id ORDER BY updated_at DESC) as rn
        FROM payments
      ) AS latest_payment ON b.id = latest_payment.booking_id AND latest_payment.rn = 1
      WHERE b.is_hidden = 0 ${dateCondition}
      ORDER BY b.created_at DESC
      LIMIT 10
    `, params);

    // Thống kê theo ngày (7 ngày gần nhất)
    const [dailyStats] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as bookings,
        SUM(final_amount) as revenue
      FROM bookings
      WHERE is_hidden = 0 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    return {
      ...stats[0],
      paid_bookings: paymentStats[0].paid_bookings || 0,
      total_paid: paymentStats[0].total_paid || 0,
      successful_payments: paymentStats[0].successful_payments || 0,
      failed_payments: paymentStats[0].failed_payments || 0,
      top_tours: topTours,
      recent_bookings: recentBookings,
      daily_stats: dailyStats
    };
  }

  /**
   * ✅ [ADMIN] Cập nhật trạng thái booking với lý do
   */
  static async updateStatusByAdmin(bookingId, status, reason = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Không tìm thấy booking');
      }

      // Nếu hủy booking, hoàn trả slots
      if (status === 'cancelled' && booking.status !== 'cancelled') {
        const [details] = await connection.query(
          'SELECT SUM(quantity) as total FROM booking_details WHERE booking_id = ?',
          [bookingId]
        );
        
        if (details[0].total > 0 && booking.tour_departure_id) {
          await TourDeparture.restoreSlots(
            booking.tour_departure_id, 
            details[0].total, 
            connection
          );
        }
      }

      // Cập nhật trạng thái
      await connection.execute(
        'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, bookingId]
      );

      await connection.commit();

      return { booking, reason };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * ✅ [ADMIN] Xuất dữ liệu booking cho báo cáo
   */
  static async getExportData(filters = {}) {
    const { status, payment_status, date_from, date_to } = filters;

    let whereConditions = ['b.is_hidden = 0'];
    const queryParams = [];

    if (status) {
      whereConditions.push('b.status = ?');
      queryParams.push(status);
    }

    if (payment_status) {
      whereConditions.push('latest_payment.payment_status = ?');
      queryParams.push(payment_status);
    }

    if (date_from) {
      whereConditions.push('b.created_at >= ?');
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push('b.created_at <= ?');
      queryParams.push(date_to + ' 23:59:59');
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const [bookings] = await pool.query(`
      SELECT 
        b.id as 'Mã đơn',
        b.contact_name as 'Khách hàng',
        b.contact_email as 'Email',
        b.contact_phone as 'SĐT',
        t.destination as 'Tour',
        td.departure_date as 'Ngày khởi hành',
        b.final_amount as 'Tổng tiền',
        b.status as 'Trạng thái booking',
        latest_payment.payment_status as 'Trạng thái TT',
        b.created_at as 'Ngày đặt'
      FROM bookings b
      LEFT JOIN tours t ON b.tour_id = t.id
      LEFT JOIN tour_departures td ON b.tour_departure_id = td.id
      LEFT JOIN (
        SELECT 
          booking_id, 
          payment_status,
          ROW_NUMBER() OVER(PARTITION BY booking_id ORDER BY updated_at DESC) as rn
        FROM payments
      ) AS latest_payment ON b.id = latest_payment.booking_id AND latest_payment.rn = 1
      ${whereClause}
      ORDER BY b.created_at DESC
    `, queryParams);

    return bookings;
  }

  /**
   * HÀM 1: HỦY BOOKING CHƯA THANH TOÁN 
   * Chỉ dành cho booking ở trạng thái pending_payment
   */
  static async cancelUnpaidBooking(bookingId, userId, connection = null) {
    const shouldReleaseConnection = !connection;
    if (!connection) {
      connection = await pool.getConnection();
    }

    try {
      if (shouldReleaseConnection) {
        await connection.beginTransaction();
      }

      // Lấy thông tin booking
      const booking = await Booking.findByIdForUpdate(bookingId, userId, connection);

      if (!booking) {
        throw new Error('Đơn hàng không tồn tại hoặc bạn không có quyền hủy.');
      }

      if (booking.status !== 'pending_payment') {
        throw new Error('Chỉ có thể hủy các đơn hàng đang chờ thanh toán.');
      }

      // Hoàn trả slots
      const slotsToRestore = booking.BookingDetails.reduce(
        (total, detail) => total + detail.quantity, 
        0
      );

      await TourDeparture.restoreSlots(
        booking.tour_departure_id, 
        slotsToRestore, 
        connection
      );

      // Cập nhật trạng thái
      await Booking.updateStatus(bookingId, 'cancelled', connection);

      if (shouldReleaseConnection) {
        await connection.commit();
      }

      return {
        success: true,
        message: 'Hủy booking thành công',
        refundAmount: 0,
        refundReason: 'Booking chưa thanh toán, hủy miễn phí'
      };

    } catch (error) {
      if (shouldReleaseConnection) {
        await connection.rollback();
      }
      throw error;
    } finally {
      if (shouldReleaseConnection) {
        connection.release();
      }
    }
  }


/**
 * HỦY BOOKING ĐÃ THANH TOÁN (CÓ KIỂM DUYỆT)
 * - Hủy ≥15 ngày: 100% → pending_cancellation → admin duyệt
 * - Hủy ≥7 ngày: 80% → pending_cancellation → admin duyệt
 * - Hủy 3-6 ngày: 50% → pending_cancellation → admin duyệt  
 * - Hủy <3 ngày: 0% → cancelled ngay
 */
static async cancelPaidBooking(bookingId, userId, refundMethod = 'credit') {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    console.log(`[cancelPaidBooking] Processing: Booking ${bookingId}, User ${userId}, Method: ${refundMethod}`);

    // LẤY THÔNG TIN BOOKING
    const [bookings] = await connection.query(`
      SELECT 
        b.id,
        b.user_id,
        b.tour_id,
        b.tour_departure_id,
        b.status,
        b.final_amount,
        b.contact_name,
        b.contact_phone,
        b.contact_email,
        td.departure_date,
        td.end_date,
        p.payment_status as payment_table_status,
        p.amount as paid_amount,
        p.payment_method,
        p.vnp_TransactionNo,
        t.destination as tour_name,
        t.image as tour_image,
        (SELECT SUM(quantity) FROM booking_details WHERE booking_id = b.id) as total_guests
      FROM bookings b
      INNER JOIN tour_departures td ON b.tour_departure_id = td.id
      INNER JOIN tours t ON b.tour_id = t.id
      LEFT JOIN (
        SELECT booking_id, payment_status, amount, payment_method, vnp_TransactionNo
        FROM payments
        WHERE payment_status = 'success'
        ORDER BY updated_at DESC
        LIMIT 1
      ) p ON b.id = p.booking_id
      WHERE b.id = ? AND b.user_id = ?
      FOR UPDATE
    `, [bookingId, userId]);

    if (!bookings || bookings.length === 0) {
      throw new Error('Không tìm thấy booking hoặc bạn không có quyền hủy booking này');
    }

    const booking = bookings[0];

    // VALIDATE TRẠNG THÁI
    if (booking.status === 'cancelled') {
      throw new Error('Booking đã bị hủy trước đó');
    }

    if (booking.status === 'pending_cancellation') {
      throw new Error('Yêu cầu hủy đang được xử lý. Vui lòng chờ admin phản hồi trong 24-48h.');
    }

    if (booking.status === 'completed') {
      throw new Error('Không thể hủy tour đã hoàn thành');
    }

    // KIỂM TRA THANH TOÁN
    const actualPaymentStatus = booking.payment_status || booking.payment_table_status;
    const actualPaidAmount = booking.paid_amount || booking.final_amount;

    if (actualPaymentStatus !== 'success' || !actualPaidAmount) {
      throw new Error('Booking chưa được thanh toán. Vui lòng sử dụng chức năng hủy thông thường.');
    }

    // TÍNH SỐ NGÀY CÒN LẠI
    const departureDate = new Date(booking.departure_date);
    const now = new Date();
    const daysUntilDeparture = Math.ceil((departureDate - now) / (1000 * 60 * 60 * 24));

    console.log(`[cancelPaidBooking] Days until departure: ${daysUntilDeparture}`);

    if (daysUntilDeparture < 0) {
      throw new Error('Không thể hủy tour đã qua ngày khởi hành');
    }

    // TÍNH TOÁN REFUND THEO CHÍNH SÁCH
    let refundPercent = 0;
    let requiresApproval = false;
    let refundReason = '';

    if (daysUntilDeparture >= 15) {
      refundPercent = 100;
      requiresApproval = true;
      refundReason = `Hủy trước ${daysUntilDeparture} ngày (≥15 ngày), được hoàn 100% theo chính sách`;
    } else if (daysUntilDeparture >= 7) {
      refundPercent = 80;
      requiresApproval = true;
      refundReason = `Hủy trước ${daysUntilDeparture} ngày (7-14 ngày), được hoàn 80% theo chính sách`;
    } else if (daysUntilDeparture >= 3) {
      refundPercent = 50;
      requiresApproval = true;
      refundReason = `Hủy trước ${daysUntilDeparture} ngày (3-6 ngày), được hoàn 50% theo chính sách`;
    } else {
      refundPercent = 0;
      requiresApproval = false;
      refundReason = `Hủy muộn (${daysUntilDeparture} ngày trước khởi hành, dưới 3 ngày), không được hoàn tiền theo chính sách`;
    }

    const refundAmount = Math.round((actualPaidAmount * refundPercent) / 100);
    const processingFee = refundMethod === 'bank_transfer' ? Math.round(refundAmount * 0.02) : 0;
    const finalRefundAmount = refundAmount - processingFee;

    console.log(`[cancelPaidBooking] Refund calculation:`, {
      refundPercent,
      refundAmount,
      processingFee,
      finalRefundAmount,
      requiresApproval,
      refundReason
    });

    // XỬ LÝ THEO 2 TRƯỜNG HỢP

    if (requiresApproval) {
      // ⏳ CẦN ADMIN DUYỆT (≥3 ngày trước khởi hành)

      // A. Cập nhật booking → pending_cancellation
      await connection.execute(
        `UPDATE bookings 
         SET status = 'pending_cancellation', 
             updated_at = NOW()
         WHERE id = ?`,
        [bookingId]
      );

      // B. Tạo refund request với refund_reason
      let refundId = null;

      if (refundMethod === 'credit') {
        const [refundResult] = await connection.execute(`
          INSERT INTO refunds 
          (booking_id, refund_amount, refund_percent, refund_reason, refund_method, refund_status, processing_fee, created_at)
          VALUES (?, ?, ?, ?, 'credit', 'pending', 0, NOW())
        `, [bookingId, refundAmount, refundPercent, refundReason]);

        refundId = refundResult.insertId;

        console.log(`[cancelPaidBooking] ⏳ Credit refund pending admin approval (Refund ID: ${refundId})`);

      } else if (refundMethod === 'bank_transfer') {
        const [refundResult] = await connection.execute(`
          INSERT INTO refunds 
          (booking_id, refund_amount, refund_percent, refund_reason, refund_method, refund_status, processing_fee, created_at)
          VALUES (?, ?, ?, ?, 'bank_transfer', 'pending', ?, NOW())
        `, [bookingId, finalRefundAmount, refundPercent, refundReason, processingFee]);

        refundId = refundResult.insertId;

        console.log(`[cancelPaidBooking] ⏳ Bank transfer refund pending admin approval (Refund ID: ${refundId})`);
      }

      await connection.commit();

      return {
        success: true,
        requiresApproval: true,
        refund_id: refundId,
        message: refundMethod === 'credit'
          ? 'Yêu cầu hủy tour đã được gửi. Admin sẽ xem xét và hoàn tiền vào ví Credit của bạn trong 24-48h.'
          : 'Yêu cầu hủy tour đã được gửi. Admin sẽ xem xét và chuyển khoản trong 7-10 ngày làm việc.',
        refundMethod,
        refundPercent,
        refundAmount: finalRefundAmount,
        refundReason, 
        processingFee,
        originalRefundAmount: refundAmount,
        refundStatus: 'pending',
        daysUntilDeparture,
        bookingDetails: {
          bookingId,
          tourName: booking.tour_name,
          departureDate: booking.departure_date,
          paidAmount: actualPaidAmount,
          paymentMethod: booking.payment_method,
          transactionNo: booking.vnp_TransactionNo
        }
      };

    } else {
      // ❌ HỦY NGAY (<3 ngày, không hoàn tiền)

      await connection.execute(
        `UPDATE bookings 
         SET status = 'cancelled', 
             updated_at = NOW()
         WHERE id = ?`,
        [bookingId]
      );

      // Hoàn trả slots
      if (booking.tour_departure_id && booking.total_guests > 0) {
        await TourDeparture.restoreSlots(
          booking.tour_departure_id,
          booking.total_guests,
          connection
        );
      }

      // Tạo refund record với refund_reason
      await connection.execute(`
        INSERT INTO refunds 
        (booking_id, refund_amount, refund_percent, refund_reason, refund_method, refund_status, created_at, processed_at)
        VALUES (?, 0, 0, ?, 'none', 'rejected', NOW(), NOW())
      `, [bookingId, refundReason]);

      await connection.commit();

      console.log(`[cancelPaidBooking] ❌ Booking cancelled without refund (Reason: ${refundReason})`);

      return {
        success: true,
        requiresApproval: false,
        message: `Tour đã được hủy.\n\n ⚠️ ${refundReason}`,
        refundMethod: 'none',
        refundPercent: 0,
        refundAmount: 0,
        refundReason, 
        processingFee: 0,
        daysUntilDeparture,
        bookingDetails: {
          bookingId,
          tourName: booking.tour_name,
          departureDate: booking.departure_date,
          paidAmount: actualPaidAmount
        }
      };
    }

  } catch (error) {
    await connection.rollback();
    console.error('[cancelPaidBooking] Error:', error);
    throw error;
  } finally {
    connection.release();
  }
}
  /**
   * TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI 'COMPLETED' - SỬ DỤNG END_DATE
   */
  static async markCompletedBookings(io = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Tìm các booking đã qua NGÀY KẾT THÚC (end_date)
      const [completedBookings] = await connection.query(`
        SELECT 
          b.id, 
          b.user_id,
          t.destination as tour_name,
          td.departure_date,
          td.end_date,
          td.duration
        FROM bookings b
        JOIN tour_departures td ON b.tour_departure_id = td.id
        JOIN tours t ON b.tour_id = t.id
        WHERE b.status = 'confirmed' 
          AND td.end_date IS NOT NULL
          AND td.end_date < CURDATE()
      `);

      if (completedBookings.length === 0) {
        console.log('[CRON] No bookings to mark as completed.');
        await connection.commit();
        return 0;
      }

      // Cập nhật trạng thái VÀ completion_date
      const bookingIds = completedBookings.map(b => b.id);
      await connection.query(`
        UPDATE bookings 
        SET 
          status = 'completed', 
          completion_date = NOW(),
          updated_at = NOW()
        WHERE id IN (?)
      `, [bookingIds]);

      await connection.commit();

      // GỬI THÔNG BÁO 
      if (io) {
        setImmediate(async () => {
          try {
            for (const booking of completedBookings) {
              await NotificationService.notifyBookingCompleted(
                io,
                booking.user_id,
                booking.id,
                booking.tour_name
              );
            }
          } catch (err) {
            console.error('[Cron] Error sending notifications:', err);
          }
        });
      }
      
      console.log(`[CRON] Marked ${completedBookings.length} bookings as completed:`);
      completedBookings.forEach(b => {
        console.log(`  - Booking #${b.id}: ${b.tour_name} (End: ${b.end_date})`);
      });
      
      return completedBookings.length;

    } catch (error) {
      await connection.rollback();
      console.error('[CRON] Error marking completed bookings:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}
module.exports = Booking;
