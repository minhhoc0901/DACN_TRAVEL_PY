import api from './api';

export const notificationService = {
    /**
     * Lấy danh sách thông báo của người dùng hiện tại.
     */
    getNotifications: async () => {
        try {
            const response = await api.get('/notifications');
            return response.data.notifications;
        } catch (error) {
            console.error("Error fetching notifications:", error.response?.data?.message || error.message);
            throw error;
        }
    },

    /**
     * Lấy số lượng thông báo chưa đọc.
     */
    getUnreadCount: async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            return response.data.count;
        } catch (error) {
            console.error("Error fetching unread count:", error.response?.data?.message || error.message);
            throw error;
        }
    },

    /**
     * Đánh dấu một thông báo là đã đọc.
     * @param {number} notificationId - ID của thông báo.
     */
    markAsRead: async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`);
        } catch (error) {
            console.error(`Error marking notification ${notificationId} as read:`, error.message);
        }
    },

    /**
     * Đánh dấu tất cả thông báo là đã đọc.
     */
    markAllAsRead: async () => {
        try {
            const response = await api.put('/notifications/mark-all-read');
            return response.data;
        } catch (error) {
            console.error("Error marking all notifications as read:", error.response?.data?.message || error.message);
            throw error;
        }
    },

    /**
     * Xóa một thông báo theo ID.
     * @param {number} notificationId - ID của thông báo.
     */
    deleteNotification: async (notificationId) => {
        try {
            const response = await api.delete(`/notifications/${notificationId}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting notification ${notificationId}:`, error.response?.data?.message || error.message);
            throw error;
        }
    }
};