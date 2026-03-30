import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import '../../../styles/admin/AdminHeader.css';

const AdminHeader = ({ activePageName }) => {
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Điều hướng nếu có action_url
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'new_message':
        return 'bi-chat-dots';
      case 'tour_approved':
        return 'bi-check-circle';
      case 'tour_rejected':
        return 'bi-x-circle';
      case 'booking_confirmed':
        return 'bi-calendar-check';
      case 'payment_success':
        return 'bi-credit-card';
      default:
        return 'bi-bell';
    }
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

  return (
    <header className="admin-top-header">
      <div className="admin-header-container">
        <div className="admin-header-left">
          <nav aria-label="breadcrumb">
            <ol className="admin-breadcrumb mb-0">
              {activePageName && (
                <li className="admin-breadcrumb-item active">{activePageName}</li>
              )}
            </ol>
          </nav>
        </div>

        <div className="admin-header-right">
          {/* ✅ ĐỔI TÊN: notification-wrapper → admin-notification-wrapper */}
          <div className="admin-notification-wrapper" ref={notificationRef}>
            {/* ✅ ĐỔI TÊN: notification-btn → admin-notification-btn */}
            <button 
              className="admin-notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <i className="bi bi-bell"></i>
              {unreadCount > 0 && (
                // ✅ ĐỔI TÊN: notification-badge → admin-notification-badge
                <span className="admin-notification-badge">{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              // ✅ ĐỔI TÊN: notification-dropdown → admin-notification-dropdown
              <div className="admin-notification-dropdown">
                {/* ✅ ĐỔI TÊN: notification-header → admin-notification-header */}
                <div className="admin-notification-header">
                  <h6>Thông báo</h6>
                  {/* ✅ ĐỔI TÊN: notification-count → admin-notification-count */}
                  <span className="admin-notification-count">{unreadCount} chưa đọc</span>
                </div>

                {/* ✅ ĐỔI TÊN: notification-list → admin-notification-list */}
                <div className="admin-notification-list">
                  {notifications.length === 0 ? (
                    // ✅ ĐỔI TÊN: notification-empty → admin-notification-empty
                    <div className="admin-notification-empty">
                      <i className="bi bi-bell-slash"></i>
                      <p>Không có thông báo nào</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        // ✅ ĐỔI TÊN: notification-item → admin-notification-item
                        className={`admin-notification-item ${!notification.is_read ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* ✅ ĐỔI TÊN: notification-icon → admin-notification-icon */}
                        <div className="admin-notification-icon">
                          <i className={`bi ${getNotificationIcon(notification.type)}`}></i>
                        </div>
                        {/* ✅ ĐỔI TÊN: notification-content → admin-notification-content */}
                        <div className="admin-notification-content">
                          {/* ✅ ĐỔI TÊN: notification-message → admin-notification-message */}
                          <p className="admin-notification-message">{notification.message}</p>
                          {/* ✅ ĐỔI TÊN: notification-time → admin-notification-time */}
                          <span className="admin-notification-time">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        {/* ✅ ĐỔI TÊN: notification-delete → admin-notification-delete */}
                        <button
                          className="admin-notification-delete"
                          onClick={(e) => handleDeleteNotification(e, notification.id)}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  // ✅ ĐỔI TÊN: notification-footer → admin-notification-footer
                  <div className="admin-notification-footer">
                    <button onClick={() => setShowNotifications(false)}>
                      Xem tất cả
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;