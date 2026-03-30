import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';
import { CONFIG } from '../config';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user, getToken, userLoggedIn } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch notifications from API
    const fetchNotifications = async () => {
        if (!userLoggedIn || !user) return;

        try {
            setLoading(true);
            const token = getToken();
            const response = await fetch(`${CONFIG.API_API_URL}/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.unreadCount || 0);
                }
            }
        } catch (error) {
            console.error('[NotificationContext] Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Setup Socket.IO for real-time notifications
    useEffect(() => {
        if (!userLoggedIn || !user) return;

        const newSocket = io(CONFIG.API_URL, {
            transports: ['websocket'],
            reconnection: true
        });

        newSocket.on('connect', () => {
            console.log('[NotificationContext] Socket connected');
            const token = getToken();
            if (token) {
                newSocket.emit('authenticate', token);
            }
        });

        // Listen for new notifications
        newSocket.on('new_notification', (notification) => {
            console.log('[NotificationContext] New notification received:', notification);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [userLoggedIn, user, getToken]);

    // Fetch notifications on mount
    useEffect(() => {
        fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLoggedIn]);

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            const token = getToken();
            const response = await fetch(`${CONFIG.API_API_URL}/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notificationId ? { ...n, is_read: true } : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('[NotificationContext] Error marking as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${CONFIG.API_API_URL}/notifications/mark-all-read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => ({ ...n, is_read: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('[NotificationContext] Error marking all as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        try {
            const token = getToken();
            const response = await fetch(`${CONFIG.API_API_URL}/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
            }
        } catch (error) {
            console.error('[NotificationContext] Error deleting notification:', error);
        }
    };

    const value = {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};