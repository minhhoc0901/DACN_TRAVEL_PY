const Notification = require('../models/Notification');
const NOTIFICATION_TYPES = require('../constants/notificationTypes');

/**
 * ✅ SERVICE LAYER - Xử lý tất cả logic thông báo
 */
class NotificationService {
  /**
   * HÀM CHÍNH: Tạo và emit thông báo qua socket
   */
  static async createAndEmit(io, userId, message, type, relatedId = null, actionUrl = null) {
    try {
      console.log(`[NotificationService] Creating notification for user ${userId}:`, {
        type, relatedId, actionUrl
      });

      const notification = await Notification.createNotificationWithType(
        userId,
        message,
        type,
        relatedId,
        actionUrl
      );

      if (io && notification) {
        const roomName = `user_${userId}`;
        
        io.to(roomName).emit('new_notification', {
          id: notification.id,
          message: notification.message,
          type: notification.type,
          related_id: notification.related_id,
          action_url: notification.action_url,
          is_read: notification.is_read,
          created_at: notification.created_at
        });

        console.log(`[NotificationService] ✅ Emitted to room: ${roomName}`);
      }

      return notification;

    } catch (error) {
      console.error('[NotificationService] ❌ Error:', error);
      throw error;
    }
  }

  /**
   * GỬI THÔNG BÁO HÀNG LOẠT
   */
  static async createAndEmitBulk(io, userIds, message, type, actionUrl = null) {
    try {
      const results = [];
      
      for (const userId of userIds) {
        const notification = await this.createAndEmit(io, userId, message, type, null, actionUrl);
        results.push(notification);
      }

      console.log(`[NotificationService] ✅ Sent ${results.length} bulk notifications`);
      return results;

    } catch (error) {
      console.error('[NotificationService] ❌ Bulk error:', error);
      throw error;
    }
  }

  /**
   * Helper: Lấy danh sách admin IDs
   */
  static async getAdminIds() {
    const { pool } = require('../config/db');
    const [admins] = await pool.query(
      `SELECT id FROM users WHERE role = 'admin'`
    );
    return admins.map(admin => admin.id);
  }

  // ==================== BOOKING NOTIFICATIONS ====================
  
  static async notifyBookingCreated(io, userId, bookingId, amount) {
    return this.createAndEmit(
      io,
      userId,
      `🎉 Đơn đặt tour #${bookingId} đã được tạo thành công!\n💰 Tổng tiền: ${amount.toLocaleString('vi-VN')} VNĐ\n⏰ Vui lòng thanh toán trong vòng 15 phút.`,
      NOTIFICATION_TYPES.BOOKING_CREATED,
      bookingId,
      '/profile/my-bookings'
    );
  }

  static async notifyAdminNewBooking(io, adminIds, bookingId, customerName, tourName, amount) {
    const message = `📝 Booking mới #${bookingId}\n👤 Khách hàng: ${customerName}\n🏖️ Tour: ${tourName}\n💰 ${amount.toLocaleString('vi-VN')} VNĐ`;

    for (const adminId of adminIds) {
      await this.createAndEmit(
        io,
        adminId,
        message,
        NOTIFICATION_TYPES.BOOKING_CREATED,
        bookingId,
        '/admin/bookings'
      );
    }
  }

  static async notifyBookingConfirmed(io, userId, bookingId) {
    return this.createAndEmit(
      io,
      userId,
      `✅ Booking #${bookingId} của bạn đã được xác nhận!\n🎫 Chúc bạn có một chuyến đi vui vẻ!`,
      NOTIFICATION_TYPES.BOOKING_CONFIRMED,
      bookingId,
      '/profile/my-bookings'
    );
  }

  static async notifyBookingCancelled(io, userId, bookingId, reason = null) {
    return this.createAndEmit(
      io,
      userId,
      `❌ Booking #${bookingId} đã bị hủy${reason ? `:\n${reason}` : '.'}`,
      NOTIFICATION_TYPES.BOOKING_CANCELLED,
      bookingId,
      '/profile/my-bookings'
    );
  }

  static async notifyBookingExpired(io, userId, bookingId) {
    return this.createAndEmit(
      io,
      userId,
      `⏰ Đơn đặt tour #${bookingId} đã hết hạn thanh toán (15 phút).\n💡 Bạn có thể đặt lại tour bất cứ lúc nào!`,
      NOTIFICATION_TYPES.BOOKING_CANCELLED,
      bookingId,
      '/profile/my-bookings'
    );
  }

  static async notifyBookingCompleted(io, userId, bookingId, tourName) {
    return this.createAndEmit(
      io,
      userId,
      `🎉 Tour "${tourName}" (Booking #${bookingId}) đã hoàn thành!\n✨ Cảm ơn bạn đã sử dụng dịch vụ!\n💬 Hãy để lại đánh giá cho tour này.`,
      NOTIFICATION_TYPES.BOOKING_COMPLETED,
      bookingId,
      '/profile/my-bookings'
    );
  }

  // ==================== REFUND NOTIFICATIONS ====================

  /**
   * ✅ USER: Thông báo yêu cầu hoàn tiền đang chờ xử lý
   */
  static async notifyRefundPending(io, userId, bookingId, refundAmount, tourName) {
    const message = `⏳ Yêu cầu hoàn tiền cho booking #${bookingId} ("${tourName}") đang được xử lý.\n\n💰 Số tiền: ${refundAmount.toLocaleString('vi-VN')} VNĐ\n⏱️ Thời gian xử lý: 7-10 ngày làm việc\n\nChúng tôi sẽ thông báo khi có kết quả.`;

    return this.createAndEmit(
      io,
      userId,
      message,
      NOTIFICATION_TYPES.REFUND_PENDING,
      bookingId,
      '/profile/my-bookings'
    );
  }

  /**
   * ✅ USER: Thông báo admin duyệt hoàn tiền
   */
  static async notifyRefundApproved(io, userId, bookingId, refundAmount, tourName) {
    const message = `✅ Yêu cầu hoàn tiền cho booking #${bookingId} ("${tourName}") đã được duyệt!\n\n💰 Số tiền: ${refundAmount.toLocaleString('vi-VN')} VNĐ đã được cộng vào Ví Credit của bạn`;

    return this.createAndEmit(
      io,
      userId,
      message,
      NOTIFICATION_TYPES.REFUND_APPROVED,
      bookingId,
      '/profile/my-bookings'
    );
  }

  /**
   * ✅ USER: Thông báo admin từ chối hoàn tiền
   */
  static async notifyRefundRejected(io, userId, bookingId, reason, tourName) {
    const message = `❌ Yêu cầu hoàn tiền cho booking #${bookingId} ("${tourName}") đã bị từ chối\n\n📝 Lý do: ${reason}`;

    return this.createAndEmit(
      io,
      userId,
      message,
      NOTIFICATION_TYPES.REFUND_REJECTED,
      bookingId,
      '/profile/my-bookings'
    );
  }

  /**
   * ✅ USER: Thông báo đã hoàn tiền
   */
  static async notifyRefundCompleted(io, userId, bookingId, refundAmount, refundReference, tourName) {
    const message = `✅ Đã hoàn tiền cho booking #${bookingId} ("${tourName}")\n\n💰 Số tiền: ${refundAmount.toLocaleString('vi-VN')} VNĐ\n🏦 Mã giao dịch: ${refundReference || 'N/A'}\n\nVui lòng kiểm tra tài khoản của bạn`;

    return this.createAndEmit(
      io,
      userId,
      message,
      NOTIFICATION_TYPES.REFUND_COMPLETED,
      bookingId,
      '/profile/my-bookings'
    );
  }

  /**
   * ✅ ADMIN: Thông báo có yêu cầu hoàn tiền mới
   */
  static async notifyAdminNewRefund(io, adminIds, bookingId, tourName, refundAmount, userId) {
    const message = `🔔 Yêu cầu hoàn tiền mới!\n\n📋 Booking: #${bookingId}\n🎫 Tour: ${tourName}\n💰 Số tiền: ${refundAmount.toLocaleString('vi-VN')} VNĐ\n👤 User ID: ${userId}\n\nVui lòng xem xét và xử lý.`;

    console.log(`[NotificationService] Sending refund notification to ${adminIds.length} admins`);

    // GỬI CHO TỪNG ADMIN
    for (const adminId of adminIds) {
      try {
        const notification = await this.createAndEmit(
          io,
          adminId,
          message,
          NOTIFICATION_TYPES.ADMIN_NEW_REFUND,
          bookingId,
          `/admin/refunds/${bookingId}`
        );

        console.log(`[NotificationService] ✅ Sent refund notification to admin ${adminId}`);

      } catch (error) {
        console.error(`[NotificationService] ❌ Failed to send to admin ${adminId}:`, error);
      }
    }

    return true;
  }


  // ==================== PAYMENT NOTIFICATIONS ====================
  
  static async notifyPaymentSuccess(io, userId, bookingId, amount) {
    return this.createAndEmit(
      io,
      userId,
      `💳 Thanh toán thành công ${amount.toLocaleString('vi-VN')} VNĐ cho Booking #${bookingId}`,
      NOTIFICATION_TYPES.PAYMENT_SUCCESS,
      bookingId,
      '/profile/my-bookings'
    );
  }

  static async notifyAdminPaymentSuccess(io, adminIds, bookingId, amount) {
    const message = `💳 Thanh toán thành công!\n📋 Booking #${bookingId}\n💰 ${amount.toLocaleString('vi-VN')} VNĐ`;

    for (const adminId of adminIds) {
      await this.createAndEmit(
        io,
        adminId,
        message,
        NOTIFICATION_TYPES.PAYMENT_SUCCESS,
        bookingId,
        '/admin/bookings'
      );
    }
  }

  // ==================== TOUR NOTIFICATIONS ====================
  
  static async notifyTourHidden(io, userId, tourId, tourName) {
    return this.createAndEmit(
      io,
      userId,
      `⚠️ Tour "${tourName}" của bạn đã bị ẩn và chuyển sang trạng thái "Từ chối".\nVui lòng liên hệ quản trị viên để biết thêm chi tiết.`,
      NOTIFICATION_TYPES.TOUR_REJECTED,
      tourId,
      '/user/my-tours'
    );
  }

  static async notifyTourRestored(io, userId, tourId, tourName) {
    return this.createAndEmit(
      io,
      userId,
      `🔄 Tour "${tourName}" của bạn đã được khôi phục và đặt lại về trạng thái "Chờ duyệt".\nQuản trị viên sẽ xem xét lại tour của bạn.`,
      NOTIFICATION_TYPES.TOUR_PENDING,
      tourId,
      '/user/my-tours'
    );
  }

  static async notifyAdminNewTour(io, adminIds, tourId, tourData) {
    const message = `🏖️ Tour mới chờ duyệt\n📍 Điểm đến: ${tourData.destination}\n👤 Tạo bởi: ${tourData.userName || 'Unknown'}\n🕒 Thời gian: ${tourData.duration || 'N/A'}\n📅 Khởi hành từ: ${tourData.departureFrom || 'N/A'}`;

    for (const adminId of adminIds) {
      await this.createAndEmit(
        io,
        adminId,
        message,
        NOTIFICATION_TYPES.TOUR_PENDING,
        tourId,
        `/admin/tours`
      );
    }
  }

  static async notifyTourApproved(io, userId, tourId, tourName) {
    return this.createAndEmit(
      io,
      userId,
      `✅ Tour "${tourName}" của bạn đã được duyệt và hiển thị công khai!`,
      NOTIFICATION_TYPES.TOUR_APPROVED,
      tourId,
      `/tours/${tourId}`
    );
  }

  static async notifyTourRejected(io, userId, tourId, tourName) {
    return this.createAndEmit(
      io,
      userId,
      `❌ Tour "${tourName}" đã bị từ chối.\nVui lòng liên hệ quản trị viên để biết thêm chi tiết.`,
      NOTIFICATION_TYPES.TOUR_REJECTED,
      tourId,
      '/user/my-tours'
    );
  }

  // ==================== REVIEW NOTIFICATIONS ====================
  
  static async notifyNewReview(io, userId, tourId, tourName, reviewerName, rating) {
    return this.createAndEmit(
      io,
      userId,
      `⭐ ${reviewerName} vừa đánh giá ${rating}/5 tour "${tourName}" của bạn`,
      NOTIFICATION_TYPES.NEW_REVIEW,
      tourId,
      `/tours/${tourId}`
    );
  }

  // ==================== COMMENT NOTIFICATIONS ====================
  
  static async notifyNewComment(io, userId, locationId, locationName, commenterName) {
    return this.createAndEmit(
      io,
      userId,
      `💬 ${commenterName} vừa trả lời bình luận của bạn tại "${locationName}"`,
      NOTIFICATION_TYPES.NEW_LOCATION_COMMENT,
      locationId,
      `/locations/${locationId}`
    );
  }

  // ==================== ADMIN MESSAGE NOTIFICATIONS ====================
  
  static async notifyAdminMessage(io, userId, messageId) {
    return this.createAndEmit(
      io,
      userId,
      `💬 Admin đã gửi tin nhắn cho bạn`,
      NOTIFICATION_TYPES.NEW_MESSAGE,
      messageId,
      '/chat'
    );
  }

  // ==================== WITHDRAWAL NOTIFICATIONS ====================

  /**
   * ✅ USER: Thông báo yêu cầu rút tiền đang chờ xử lý
   */
  static async notifyWithdrawalPending(io, userId, withdrawalId, amount, bankName) {
    const message = `⏳ Yêu cầu rút tiền #${withdrawalId} đang được xử lý\n\n💰 Số tiền: ${amount.toLocaleString('vi-VN')} VNĐ\n🏦 Ngân hàng: ${bankName}\n⏱️ Thời gian xử lý: 7-10 ngày làm việc\n\nChúng tôi sẽ thông báo khi có kết quả.`;

    return this.createAndEmit(
      io,
      userId,
      message,
      NOTIFICATION_TYPES.WITHDRAWAL_PENDING,
      withdrawalId,
      '/profile/credit-wallet'
    );
  }

  /**
   * ✅ USER: Thông báo admin duyệt yêu cầu rút tiền
   */
  static async notifyWithdrawalApproved(io, userId, withdrawalId, amount, bankName) {
    const message = `✅ Yêu cầu rút tiền #${withdrawalId} đã được duyệt!\n\n💰 Số tiền: ${amount.toLocaleString('vi-VN')} VNĐ\n🏦 Ngân hàng: ${bankName}\n\nSố tiền sẽ được chuyển trong 3-5 ngày làm việc.`;

    return this.createAndEmit(
      io,
      userId,
      message,
      NOTIFICATION_TYPES.WITHDRAWAL_APPROVED,
      withdrawalId,
      '/profile/credit-wallet'
    );
  }

  /**
   * ✅ USER: Thông báo admin từ chối yêu cầu rút tiền
   */
  static async notifyWithdrawalRejected(io, userId, withdrawalId, amount, reason) {
    const message = `❌ Yêu cầu rút tiền #${withdrawalId} đã bị từ chối\n\n💰 Số tiền: ${amount.toLocaleString('vi-VN')} VNĐ\n\n📝 Lý do: ${reason || 'Không đủ điều kiện rút tiền'}\n\nVui lòng liên hệ admin để biết thêm chi tiết.`;

    return this.createAndEmit(
      io,
      userId,
      message,
      NOTIFICATION_TYPES.WITHDRAWAL_REJECTED,
      withdrawalId,
      '/profile/credit-wallet'
    );
  }

  /**
   * ✅ USER: Thông báo đã chuyển tiền thành công
   */
  static async notifyWithdrawalCompleted(io, userId, withdrawalId, amount, bankName, transactionRef) {
    const message = `✅ Đã chuyển tiền cho yêu cầu rút tiền #${withdrawalId}\n\n💰 Số tiền: ${amount.toLocaleString('vi-VN')} VNĐ\n🏦 Ngân hàng: ${bankName}\n🔢 Mã giao dịch: ${transactionRef || 'N/A'}\n\nVui lòng kiểm tra tài khoản của bạn.`;

    return this.createAndEmit(
      io,
      userId,
      message,
      NOTIFICATION_TYPES.WITHDRAWAL_COMPLETED,
      withdrawalId,
      '/profile/credit-wallet'
    );
  }

  /**
   * ✅ ADMIN: Thông báo có yêu cầu rút tiền mới
   */
  static async notifyAdminNewWithdrawal(io, adminIds, withdrawalId, userId, amount, bankName, accountNumber, accountName) {
    const message = `💰 Yêu cầu rút tiền mới #${withdrawalId}!\n\n👤 User ID: ${userId}\n💵 Số tiền: ${amount.toLocaleString('vi-VN')} VNĐ\n🏦 Ngân hàng: ${bankName}\n📇 Số TK: ${accountNumber}\n👨‍💼 Chủ TK: ${accountName}\n\nVui lòng xem xét và xử lý.`;

    console.log(`[NotificationService] Sending withdrawal notification to ${adminIds.length} admins`);

    for (const adminId of adminIds) {
      try {
        await this.createAndEmit(
          io,
          adminId,
          message,
          NOTIFICATION_TYPES.ADMIN_NEW_WITHDRAWAL,
          withdrawalId,
          `/admin/withdrawals/${withdrawalId}`
        );

        console.log(`[NotificationService] ✅ Sent withdrawal notification to admin ${adminId}`);
      } catch (error) {
        console.error(`[NotificationService] ❌ Failed to send to admin ${adminId}:`, error);
      }
    }

    return true;
  }
}

module.exports = NotificationService;