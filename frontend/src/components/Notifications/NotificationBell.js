import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/NotificationBell.css';

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        if (notification.type === 'tour_approved') {
            navigate('/user/my-tours');
        } else if (notification.type === 'tour_rejected') {
            navigate('/user/my-tours');
        } else if (notification.type === 'new_review') {
            navigate(`/tours/${notification.related_id}`);
        } else if (notification.type === 'booking_confirmed') {
            navigate('/profile/my-bookings');
        }

        setIsOpen(false);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const handleDeleteNotification = async (e, notificationId) => {
        e.stopPropagation();
        await deleteNotification(notificationId);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Vừa xong';
        else if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        else if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        else return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'tour_approved': return 'bi-check-circle text-success';
            case 'tour_rejected': return 'bi-x-circle text-danger';
            case 'new_review': return 'bi-star text-warning';
            case 'booking_confirmed': return 'bi-calendar-check text-primary';
            default: return 'bi-bell text-info';
        }
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button 
                className="notification-bell-button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <i className="bi bi-bell"></i>
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Thông báo</h3>
                        {unreadCount > 0 && (
                            <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                                Đánh dấu đã đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <i className="bi bi-bell-slash"></i>
                                <p>Không có thông báo mới</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-icon">
                                        <i className={`bi ${getNotificationIcon(notification.type)}`}></i>
                                    </div>
                                    <div className="notification-content">
                                        <p className="notification-message">{notification.message}</p>
                                        <span className="notification-time">{formatTime(notification.created_at)}</span>
                                    </div>
                                    <button
                                        className="notification-delete-btn"
                                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                                        aria-label="Delete notification"
                                    >
                                        <i className="bi bi-x"></i>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <button className="view-all-btn" onClick={() => { navigate('/notifications'); setIsOpen(false); }}>
                                Xem tất cả thông báo
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;