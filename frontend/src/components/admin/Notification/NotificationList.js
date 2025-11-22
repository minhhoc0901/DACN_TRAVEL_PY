import React from 'react';

const NotificationList = ({ notifications, onDelete }) => {
  const getNotificationIcon = (type) => {
    const icons = {
      tour_approved: 'bi-check-circle-fill text-success',
      tour_rejected: 'bi-x-circle-fill text-danger',
      new_review: 'bi-star-fill text-warning',
      new_message: 'bi-chat-dots-fill text-primary',
      new_location_comment: 'bi-chat-square-text-fill text-info',
      booking_confirmed: 'bi-calendar-check-fill text-info',
      booking_cancelled: 'bi-calendar-x-fill text-danger',
      payment_success: 'bi-credit-card-fill text-success',
      system: 'bi-info-circle-fill text-secondary'
    };
    return icons[type] || 'bi-bell-fill';
  };

  const getTypeLabel = (type) => {
    const labels = {
      tour_approved: 'Tour được duyệt',
      tour_rejected: 'Tour bị từ chối',
      new_review: 'Đánh giá mới',
      new_message: 'Tin nhắn Admin',
      new_location_comment: 'Bình luận địa điểm',
      booking_confirmed: 'Đặt tour',
      booking_cancelled: 'Hủy tour',
      payment_success: 'Thanh toán',
      system: 'Hệ thống'
    };
    return labels[type] || type;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (notifications.length === 0) {
    return (
      <div className="admin-notif-empty-state">
        <i className="bi bi-inbox"></i>
        <h3>Không có thông báo nào</h3>
        <p>Chưa có thông báo nào được tạo</p>
      </div>
    );
  }

  return (
    <div className="admin-notif-list">
      {notifications.map(notif => (
        <div 
          key={notif.id} 
          className={`admin-notif-item ${!notif.is_read ? 'unread' : ''}`}
        >
          <div className="admin-notif-item-icon">
            <i className={`bi ${getNotificationIcon(notif.type)}`}></i>
          </div>

          <div className="admin-notif-item-content">
            <div className="admin-notif-item-header">
              <span className="admin-notif-type-badge">{getTypeLabel(notif.type)}</span>
              <span className="admin-notif-time">
                {formatDateTime(notif.created_at)}
              </span>
            </div>

            <p className="admin-notif-message">{notif.message}</p>

            {(notif.username || notif.full_name) && (
              <div className="admin-notif-user-info">
                <i className="bi bi-person-circle"></i>
                <span>{notif.full_name || notif.username}</span>
              </div>
            )}

            {notif.action_url && (
              <a href={notif.action_url} className="admin-notif-action-link">
                <i className="bi bi-arrow-right-circle"></i> Xem chi tiết
              </a>
            )}
          </div>

          <div className="admin-notif-item-actions">
            <button
              onClick={() => onDelete(notif.id)}
              className="admin-notif-btn-delete"
              title="Xóa thông báo"
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationList;