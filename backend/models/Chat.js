const { pool } = require('../config/db');

class Chat {
  static async saveMessage(userId, message, isBot = false) {
    try {
      const connection = await pool.getConnection();
      try {
        const query = `
          INSERT INTO chat_messages (user_id, message, is_bot, created_at)
          VALUES (?, ?, ?, NOW())
        `;
        const [result] = await connection.execute(query, [userId, message, isBot ? 1 : 0]);
        return result.insertId;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Save chat message error:', error);
      throw error;
    }
  }

static async getConversationByUserId(userId, messageLimit = 50) {
    try {
      const connection = await pool.getConnection();
      try {
        // Convert limit to number for safety
        const limit = parseInt(messageLimit, 10);
        
        // Use string interpolation for the LIMIT value
        const query = `
            SELECT * FROM (
            SELECT id, user_id, message, is_bot, created_at 
            FROM chat_messages 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
          ) AS recent_messages
          ORDER BY created_at ASC;
        `;
        
        const [rows] = await connection.query(query, [userId, limit]);
        
        // Format the results for frontend consumption
        return rows.map(row => ({
          id: row.id,
          sender: row.is_bot ? 'bot' : 'user',
          message: row.message,
          time: row.created_at
        }));
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Get conversation error:', error);
      throw error;
    }
  }
}

module.exports = Chat;