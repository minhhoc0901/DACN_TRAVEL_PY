const { pool } = require('../config/db');

class Notification {
  static async createNotification(userId, message) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [userId, message]
      );
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  // ✅ FIX: Tạo notification với đầy đủ thông tin
  static async createNotificationWithType(userId, message, type = 'system', relatedId = null, actionUrl = null) {
    const connection = await pool.getConnection();
    try {
      console.log('[Notification Model] Creating notification:', {
        userId,
        message,
        type,
        relatedId,
        actionUrl
      });

      const [result] = await connection.execute(
        'INSERT INTO notifications (user_id, message, type, related_id, action_url, is_read, created_at) VALUES (?, ?, ?, ?, ?, FALSE, NOW())',
        [userId, message, type, relatedId, actionUrl]
      );
      
      // ✅ Trả về notification vừa tạo
      const [notification] = await connection.execute(
        'SELECT * FROM notifications WHERE id = ?',
        [result.insertId]
      );
      
      console.log('[Notification Model] ✅ Notification created:', notification[0]);
      return notification[0];
    } catch (error) {
      console.error('[Notification Model] ❌ Error creating notification:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getNotificationsByUser(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // Đếm số thông báo chưa đọc
  static async getUnreadCount(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );
      return rows[0].count;
    } finally {
      connection.release();
    }
  }

  // Đánh dấu tất cả thông báo là đã đọc
  static async markAllAsRead(userId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );
      return result.affectedRows;
    } finally {
      connection.release();
    }
  }

  // Xóa thông báo cũ (trên 30 ngày)
  static async deleteOldNotifications(days = 30) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [days]
      );
      return result.affectedRows;
    } finally {
      connection.release();
    }
  }

  // static async markAsRead(notificationId) {

  //   const connection = await pool.getConnection();
  //   try {

  //     console.log(`[Model] Chuẩn bị cập nhật is_read=TRUE cho ID: ${notificationId}`);

  //     await connection.execute(
  //       'UPDATE notifications SET is_read = TRUE WHERE id = ?',
  //       [notificationId]
  //     );
  //     console.log('[Model] Kết quả cập nhật từ database:', result);

  //   } finally {
  //     connection.release();
  //   }
  // }

  static async markAsRead(notificationId) {
    const connection = await pool.getConnection();
    try {
        console.log(`[Model] Chuẩn bị cập nhật is_read=TRUE cho ID: ${notificationId}`);

        // ✅ SỬA LỖI Ở ĐÂY: Thêm "const [result] =" ở đầu dòng
        // Điều này sẽ tạo ra biến `result` để hứng kết quả từ database
        const [result] = await connection.execute(
            'UPDATE notifications SET is_read = TRUE WHERE id = ?',
            [notificationId]
        );

        // Bây giờ dòng log này sẽ hoạt động chính xác
        console.log('[Model] Kết quả cập nhật từ database:', result);

    } catch (error) {
        // Thêm log lỗi ở đây để bắt các lỗi từ DB
        console.error("Lỗi khi thực thi câu lệnh UPDATE trong model:", error);
        throw error; // Ném lỗi ra để controller có thể bắt
    } finally {
        connection.release();
    }
  }

  static async deleteNotification(notificationId) {
    const connection = await pool.getConnection();
    try {
        console.log(`[Model] Chuẩn bị xóa Notification ID: ${notificationId}`);
        const [result] = await connection.execute(
            'DELETE FROM notifications WHERE id = ?',
            [notificationId]
        );
        console.log('[Model] Kết quả xóa từ database:', result);
        // Trả về số dòng đã bị ảnh hưởng (sẽ là 1 nếu thành công)
        return result.affectedRows;
    } catch (error) {
        console.error("Lỗi khi thực thi câu lệnh DELETE trong model:", error);
        throw error;
    } finally {
        connection.release();
    }
  }

  // ✅  ADMIN - Lấy tất cả notification (có phân trang)
  // ✅ FIX: DÙNG query() THAY VÌ execute()
  static async getAllNotifications(page = 1, limit = 50, type = null) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      
      // ✅ Viết query với tham số trực tiếp (không dùng placeholders)
      let query = 'SELECT n.*, u.username, u.full_name FROM notifications n LEFT JOIN users u ON n.user_id = u.id';
      
      const params = [];
      
      // Lọc theo type nếu có
      if (type && type !== 'all') {
        query += ' WHERE n.type = ?';
        params.push(type);
      }
      
      query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset)); // ✅ FORCE PARSE TO INT
      
      console.log('[Notification Model] Query:', query);
      console.log('[Notification Model] Params:', params);
      
      // ✅ FIX: Dùng query() thay vì execute()
      const [rows] = await connection.query(query, params);
      
      // Đếm tổng số thông báo
      let countQuery = 'SELECT COUNT(*) as total FROM notifications';
      const countParams = [];
      
      if (type && type !== 'all') {
        countQuery += ' WHERE type = ?';
        countParams.push(type);
      }
      
      const [countResult] = await connection.query(countQuery, countParams);
      
      return { 
        notifications: rows, 
        total: countResult[0].total 
      };
    } catch (error) {
      console.error('[Notification Model] Error in getAllNotifications:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ✅ THÊM: ADMIN - Thống kê thông báo
  static async getNotificationStats() {
    const connection = await pool.getConnection();
    try {
      // Tổng số thông báo
      const [totalResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM notifications'
      );
      
      // Số thông báo chưa đọc
      const [unreadResult] = await connection.execute(
        'SELECT COUNT(*) as unread FROM notifications WHERE is_read = FALSE'
      );
      
      // Thống kê theo type
      const [typeStats] = await connection.execute(`
        SELECT type, COUNT(*) as count 
        FROM notifications 
        GROUP BY type
      `);
      
      // Thống kê theo ngày (7 ngày gần nhất)
      const [dailyStats] = await connection.execute(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM notifications
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
      
      return {
        total: totalResult[0].total,
        unread: unreadResult[0].unread,
        read: totalResult[0].total - unreadResult[0].unread,
        byType: typeStats,
        daily: dailyStats
      };
    } finally {
      connection.release();
    }
  }

  // ✅ THÊM: ADMIN - Gửi thông báo cho nhiều user
  static async sendBulkNotification(userIds, message, type = 'system', actionUrl = null) {
    const connection = await pool.getConnection();
    try {
      const values = userIds.map(userId => [userId, message, type, null, actionUrl, false]);
      
      const [result] = await connection.query(
        'INSERT INTO notifications (user_id, message, type, related_id, action_url, is_read) VALUES ?',
        [values]
      );
      
      return result.affectedRows;
    } finally {
      connection.release();
    }
  }

  // ✅ THÊM: ADMIN - Xóa thông báo theo ID
  static async deleteNotificationById(notificationId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM notifications WHERE id = ?',
        [notificationId]
      );
      return result.affectedRows;
    } finally {
      connection.release();
    }
  }

  // ✅ Thêm hàm getNotificationById
  static async getNotificationById(notificationId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM notifications WHERE id = ?',
        [notificationId]
      );
      return rows.length > 0 ? rows[0] : null; // Trả về thông báo đầu tiên hoặc null nếu không tìm thấy
    } catch (error) {
      console.error('[Notification Model] ❌ Error fetching notification by ID:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Notification;