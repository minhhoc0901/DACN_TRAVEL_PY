const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

class User {
  constructor(user) {
    this.username = user.username;
    this.fullName = user.fullName;
    this.email = user.email;
    this.phone = user.phone;
    this.password = user.password;
    this.role = user.role || 'user';
  }

  async register() {
    const connection = await pool.getConnection();
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);

      const [result] = await connection.execute(
        'INSERT INTO Users (username, full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
        [this.username, this.fullName, this.email, this.phone, hashedPassword, this.role]
      );

      return {
        id: result.insertId,
        username: this.username,
        fullName: this.fullName,
        email: this.email,
        phone: this.phone,
        role: this.role
      };
    } finally {
      connection.release();
    }
  }

  // Tìm người dùng theo email
  static async findByEmail(email) {
    try {
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.execute(
          'SELECT * FROM Users WHERE email = ?',
          [email]
        );

        return rows.length ? rows[0] : null;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw error;
    }
  }

  // Tìm người dùng theo username
  static async findByUsername(username) {
    try {
      const connection = await pool.getConnection();
      try {
        // Đảm bảo câu SQL có lấy trường 'avatar'
        const [rows] = await connection.execute(
          'SELECT id, username, full_name, email, phone, role, password_hash, created_at, avatar FROM Users WHERE username = ?',
          [username]
        );
        return rows.length ? rows[0] : null;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw error;
    }
  }

  // Tìm người dùng theo ID
  static async findById(id) {
    try {
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.execute(
          'SELECT id, username, full_name, email, phone, role, password_hash, created_at, avatar FROM Users WHERE id = ?', // Thêm password_hash
          [id]
        );

        return rows.length ? rows[0] : null;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách tất cả người dùng (chỉ admin)
  static async findAll() {
    try {
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.execute(
          'SELECT id, username, full_name, email, phone, role, created_at FROM Users'
        );

        return rows;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thông tin người dùng
  static async updateUser(id, userData) {
    try {
      const connection = await pool.getConnection();
      try {
        const fieldsToUpdate = [];
        const values = [];

        if (userData.username) {
          fieldsToUpdate.push('username = ?');
          values.push(userData.username);
        }

        if (userData.fullName) {
          fieldsToUpdate.push('full_name = ?');
          values.push(userData.fullName);
        }

        if (userData.email) {
          fieldsToUpdate.push('email = ?');
          values.push(userData.email);
        }

        if (userData.phone) {
          fieldsToUpdate.push('phone = ?');
          values.push(userData.phone);
        }

        if (userData.password) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(userData.password, salt);
          fieldsToUpdate.push('password_hash = ?');
          values.push(hashedPassword);
        }

        if (userData.role) {
          fieldsToUpdate.push('role = ?');
          values.push(userData.role);
        }

        if (userData.avatar) {
        fieldsToUpdate.push('avatar = ?');
        values.push(userData.avatar);
        }
        
        if (fieldsToUpdate.length === 0) {
        return true; // Không có thay đổi
        }

        values.push(id);
        const query = `UPDATE Users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
        const [result] = await connection.execute(query, values);

        return result.affectedRows > 0;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw error;
    }
  }

  // Xóa người dùng
  static async deleteUser(id) {
    try {
      const connection = await pool.getConnection();
      try {
        const [result] = await connection.execute(
          'DELETE FROM Users WHERE id = ?',
          [id]
        );

        return result.affectedRows > 0;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw error;
    }
  }

  // Thêm các phương thức mới
  static async saveOTP(email, otp) {
    const connection = await pool.getConnection();
    try {
        // Xóa OTP cũ
        await connection.execute(
            'DELETE FROM user_otps WHERE email = ?',
            [email]
        );


        await connection.execute(
            'INSERT INTO user_otps (email, otp, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
            [email, otp]
        );
        return true;
    } finally {
        connection.release();
    }
  }

  static async verifyOTP(email, otp) {
    const connection = await pool.getConnection();
    try {
        // Kiểm tra OTP còn hạn và chưa được sử dụng
        const [rows] = await connection.execute(
            `SELECT * FROM user_otps 
             WHERE email = ? 
             AND otp = ? 
             AND expires_at > NOW()`,  // Bỏ điều kiện used = 0
            [email, otp]
        );

        if (rows.length > 0) {

            return true;
        }
        return false;
    } finally {
        connection.release();
    }
  }
}

module.exports = User;