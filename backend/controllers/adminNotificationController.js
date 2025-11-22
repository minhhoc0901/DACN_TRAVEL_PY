const Notification = require('../models/Notification');

// Lấy tất cả thông báo (Admin)
exports.getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50, type = 'all' } = req.query;
    
    const result = await Notification.getAllNotifications(
      parseInt(page), 
      parseInt(limit),
      type
    );
    
    res.status(200).json({
      success: true,
      data: result.notifications,
      total: result.total,
      page: parseInt(page),
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (error) {
    console.error('[Admin] Error fetching all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thông báo'
    });
  }
};

// Lấy thống kê thông báo
exports.getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.getNotificationStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Admin] Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê thông báo'
    });
  }
};

// Gửi thông báo cho nhiều user
exports.sendBulkNotification = async (req, res) => {
  try {
    const { userIds, message, type = 'system', actionUrl = null } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một người dùng'
      });
    }
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nội dung thông báo không được để trống'
      });
    }
    
    const affectedRows = await Notification.sendBulkNotification(
      userIds,
      message.trim(),
      type,
      actionUrl
    );
    
    // Emit thông báo qua socket
    const io = req.app.get('io');
    if (io) {
      userIds.forEach(userId => {
        io.to(`user_${userId}`).emit('new_notification', {
          id: Date.now(),
          user_id: userId,
          message: message.trim(),
          type,
          action_url: actionUrl,
          is_read: false,
          created_at: new Date()
        });
      });
      console.log(`[Admin] Sent bulk notification to ${userIds.length} users`);
    }
    
    res.status(200).json({
      success: true,
      message: `Đã gửi thông báo cho ${affectedRows} người dùng`
    });
  } catch (error) {
    console.error('[Admin] Error sending bulk notification:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi thông báo',
      error: error.message
    });
  }
};

// Xóa thông báo
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const affectedRows = await Notification.deleteNotificationById(id);
    
    if (affectedRows > 0) {
      res.status(200).json({
        success: true,
        message: 'Đã xóa thông báo'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
  } catch (error) {
    console.error('[Admin] Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa thông báo'
    });
  }
};