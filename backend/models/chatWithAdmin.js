
const { pool } = require('../config/db');

class ChatWithAdmin {
    /**
     * ✅ Sửa lại để ĐÓNG GÓI mảng ảnh thành chuỗi JSON
     */
    static async saveMessage(senderId, receiverId, message, imageUrls = null) {
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO chat_with_admin (sender_id, receiver_id, message, image_url, created_at)
                VALUES (?, ?, ?, ?, NOW())
            `;
            // "Đóng hộp" mảng thành chuỗi JSON trước khi lưu.
            // Nếu không có ảnh, giá trị sẽ là NULL.
            const imageUrlsJson = imageUrls && imageUrls.length > 0 ? JSON.stringify(imageUrls) : null;
            
            const [result] = await connection.execute(query, [senderId, receiverId, message, imageUrlsJson]);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    /**
     * ✅ Sửa lại để đảm bảo luôn trả về một mảng
     */
    static async getConversation(userId1, userId2, messageLimit = 50) {
        const connection = await pool.getConnection();
        try {
            const query = `
                SELECT id, sender_id, receiver_id, message, image_url, is_read, created_at 
                FROM chat_with_admin 
                WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) AND is_deleted = 0
                ORDER BY created_at ASC 
                LIMIT ?
            `;
            const [rows] = await connection.query(query, [userId1, userId2, userId2, userId1, parseInt(messageLimit, 10)]);
            
            return rows.map(row => {
                // Thư viện mysql2 sẽ tự động parse cột JSON thành mảng.
                // Chúng ta chỉ cần đảm bảo nó không phải là null.
                return {
                    id: row.id,
                    senderId: row.sender_id,
                    receiverId: row.receiver_id,
                    message: row.message,
                    imageUrls: row.image_url || [], // Nếu image_url là NULL, trả về mảng rỗng
                    isRead: row.is_read,
                    time: row.created_at
                };
            });
        } finally {
            connection.release();
        }
    }

    /**
     * ✅ Đánh dấu tất cả tin nhắn từ một người gửi là đã đọc.
     */
    static async markMessagesAsRead(senderId, receiverId) {
        const connection = await pool.getConnection();
        try {
            const query = `
                UPDATE chat_with_admin 
                SET is_read = 1 
                WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
            `;
            await connection.execute(query, [senderId, receiverId]);
        } finally {
            connection.release();
        }
    }

    /**
     * ✅ Xóa một tin nhắn (soft delete).
     */
    static async deleteMessage(messageId, userId) {
        const connection = await pool.getConnection();
        try {
            const query = `
                UPDATE chat_with_admin 
                SET is_deleted = 1, message = 'Tin nhắn đã được thu hồi', image_url = NULL
                WHERE id = ? AND sender_id = ?
            `;
            const [result] = await connection.execute(query, [messageId, userId]);
            return result.affectedRows;
        } finally {
            connection.release();
        }
    }

    /**
     * ✅ Lấy danh sách user đã chat, kèm theo số tin nhắn chưa đọc.
     */
    static async getAllChatUsers() {
        const connection = await pool.getConnection();
        try {
            const [adminRows] = await connection.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
            if (adminRows.length === 0) return [];
            const adminId = adminRows[0].id;

            const query = `
                SELECT 
                    u.id, 
                    u.full_name AS fullName, 
                    u.avatar,
                    (SELECT COUNT(c.id) FROM chat_with_admin c WHERE c.sender_id = u.id AND c.receiver_id = ? AND c.is_read = 0) AS unreadCount
                FROM users u
                JOIN (
                    SELECT DISTINCT sender_id AS userId FROM chat_with_admin WHERE receiver_id = ?
                    UNION
                    SELECT DISTINCT receiver_id AS userId FROM chat_with_admin WHERE sender_id = ?
                ) AS chat_participants ON u.id = chat_participants.userId
                WHERE u.id != ?;
            `;
            const [rows] = await connection.query(query, [adminId, adminId, adminId, adminId]);
            
            const baseUrl = 'http://localhost:5000';
            return rows.map(user => ({
                id: user.id,
                fullName: user.fullName,
                avatar: user.avatar ? `${baseUrl}${user.avatar}` : null,
                unreadCount: user.unreadCount
            }));
        } finally {
            connection.release();
        }
    }
    
    /**
     * Lấy ID của admin.
     */
    static async getAdminId() {
        const connection = await pool.getConnection();
        try {
            const [adminRows] = await connection.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
            if (adminRows.length === 0) throw new Error('Không tìm thấy tài khoản admin');
            return adminRows[0].id;
        } finally {
            connection.release();
        }
    }
}

module.exports = ChatWithAdmin;