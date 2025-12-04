const { pool } = require('../config/db');

class LocationComment {
  /**
   * Tạo comment mới (có thể là reply)
   */
  static async createComment({ locationId, userId, comment, parentId = null }) {
    const connection = await pool.getConnection();
    try {
      const query = `
        INSERT INTO location_comments (location_id, user_id, parent_id, comment)
        VALUES (?, ?, ?, ?)
      `;
      const [result] = await connection.execute(query, [locationId, userId, parentId, comment]);
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy tất cả comments của một địa điểm (kèm replies)
   */
  static async getCommentsByLocationId(locationId) {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT 
          lc.id,
          lc.location_id,
          lc.user_id,
          lc.parent_id,
          lc.comment,
          lc.created_at,
          u.username,
          u.full_name,
          u.avatar
        FROM location_comments lc
        INNER JOIN users u ON lc.user_id = u.id
        WHERE lc.location_id = ?
        ORDER BY lc.created_at ASC
      `;
      const [rows] = await connection.execute(query, [locationId]);
      
      // Tổ chức comments thành cây (parent-child)
      const commentsMap = {};
      const rootComments = [];
      
      rows.forEach(comment => {
        comment.replies = [];
        commentsMap[comment.id] = comment;
      });
      
      rows.forEach(comment => {
        if (comment.parent_id) {
          // Là reply
          if (commentsMap[comment.parent_id]) {
            commentsMap[comment.parent_id].replies.push(comment);
          }
        } else {
          // Là comment gốc
          rootComments.push(comment);
        }
      });
      
      return rootComments;
    } finally {
      connection.release();
    }
  }

  /**
   * Xóa comment
   */
  static async deleteComment(commentId, userId) {
    const connection = await pool.getConnection();
    try {
      const query = `DELETE FROM location_comments WHERE id = ? AND user_id = ?`;
      const [result] = await connection.execute(query, [commentId, userId]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy thông tin comment theo ID
   */
  static async getCommentById(commentId) {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT 
          lc.id,
          lc.location_id,
          lc.user_id,
          lc.parent_id,
          lc.comment,
          lc.created_at,
          u.username,
          u.full_name,
          u.avatar
        FROM location_comments lc
        INNER JOIN users u ON lc.user_id = u.id
        WHERE lc.id = ?
      `;
      const [rows] = await connection.execute(query, [commentId]);
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }
}

module.exports = LocationComment;