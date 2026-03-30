const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo pool kết nối
const pool = process.env.DATABASE_URL 
    ? mysql.createPool(process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'timezone=+07:00')
    : mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || "3306"),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: '+07:00'
    });

// Kiểm tra kết nối
async function checkConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Kết nối MySQL thành công!');
        connection.release();
    } catch (error) {
        console.error('Lỗi kết nối MySQL:', error.message);
    }
}

module.exports = { pool, checkConnection };