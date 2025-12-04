const Notification = require('../models/Notification');

exports.createNotification = async (req, res) => {
  try {
    const { userId, message } = req.body;
    const notificationId = await Notification.createNotification(userId, message);
    res.status(201).json({ success: true, notificationId });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo thông báo' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ middleware xác thực
    const notifications = await Notification.getNotificationsByUser(userId);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông báo' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.getUnreadCount(userId);
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi đếm thông báo chưa đọc' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    console.log(`[Controller] Nhận được yêu cầu đánh dấu đã đọc cho Notification ID: ${notificationId}`);

    await Notification.markAsRead(notificationId);
    res.status(200).json({ success: true, message: 'Thông báo đã được đánh dấu là đã đọc' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi đánh dấu thông báo' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const affectedRows = await Notification.markAllAsRead(userId);
    res.status(200).json({ success: true, affectedRows });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi đánh dấu tất cả đã đọc' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    console.log(`[Controller] Nhận được yêu cầu xóa cho Notification ID: ${notificationId}`);
    
    const affectedRows = await Notification.deleteNotification(notificationId);

    if (affectedRows > 0) {
      res.status(200).json({ success: true, message: 'Thông báo đã được xóa' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy thông báo để xóa' });
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa thông báo' });
  }
};

// REJECT TOUR
exports.rejectTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const tour = await Tour.findOne({ _id: tourId });

    if (!tour) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tour' });
    }

    // 1. Xóa tour
    await Tour.deleteOne({ _id: tourId });

    // 2. Tạo notification với action_url
    const notificationMessage = `Tour "${tour.destination}" của bạn đã bị từ chối. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.`;
    const actionUrl = `/user/my-tours`; // Sửa URL trỏ về trang quản lý tour của người dùng
    
    const notification = await Notification.createNotificationWithType(
      tour.user_id,
      notificationMessage,
      actionUrl
    );

    res.status(200).json({ success: true, message: 'Tour đã bị từ chối' });
  } catch (error) {
    console.error('Error rejecting tour:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi từ chối tour' });
  }
};