import React from 'react';

const NotificationList = ({ notifications, onDelete }) => {
  const getNotificationIcon = (type) => {
    const icons = {
      'booking_confirmed': 'bi-calendar-check',
      'booking_cancelled': 'bi-x-circle',
      'payment_success': 'bi-credit-card',
      'tour_approved': 'bi-check-circle',
      'tour_rejected': 'bi-x-circle'
    };
    return icons[type] || 'bi-bell';
  };

  const getIconClass = (type) => {
    if (type?.includes('booking')) return 'type-booking';
    if (type?.includes('tour')) return 'type-tour';
    if (type?.includes('payment')) return 'type-payment';
    return 'type-system';
  };

  const getNotificationType = (type) => {
    const types = {
      'booking_confirmed': 'Xác nhận booking',
      'booking_cancelled': 'Hủy tour',
      'payment_success': 'Thanh toán',
      'tour_approved': 'Duyệt tour',
      'tour_rejected': 'Từ chối tour'
    };
    return types[type] || type;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  if (notifications.length === 0) {
    return (
      <div className="qltb-notification-list-section">
        <div className="qltb-empty-state">
          <div className="qltb-empty-icon">
            <i className="bi bi-bell-slash"></i>
          </div>
          <h3>Không có thông báo</h3>
          <p>Chưa có thông báo nào trong hệ thống</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qltb-notification-list-section">
      <div className="qltb-notification-list">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`qltb-notification-item ${!notification.is_read ? 'unread' : ''}`}
          >
            <div className={`qltb-notification-icon-wrapper ${getIconClass(notification.type)}`}>
              <i className={`bi ${getNotificationIcon(notification.type)}`}></i>
            </div>
            
            <div className="qltb-notification-content">
              <div className="qltb-notification-header">
                <span className="qltb-notification-type">
                  {getNotificationType(notification.type)}
                </span>
                <span className="qltb-notification-time">
                  {formatTime(notification.created_at)}
                </span>
              </div>
              
              <p className="qltb-notification-message">
                {notification.message}
              </p>
              
              {(notification.username || notification.full_name) && (
                <div className="qltb-notification-user">
                  <i className="bi bi-person"></i>
                  <span>{notification.full_name || notification.username}</span>
                </div>
              )}
            </div>
            
            <div className="qltb-notification-actions">
              <button 
                className="qltb-notification-delete-btn"
                onClick={() => onDelete(notification.id)}
                title="Xóa"
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationList;