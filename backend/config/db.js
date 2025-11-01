const mysql = require('mysql2/promise');
require('dotenv').config();

// Cấu hình kết nối MySQL
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // charset: 'utf8mb4'
    timezone: '+07:00' // Cấu hình múi giờ GMT+7
};

// Tạo pool kết nối
const pool = mysql.createPool(dbConfig);

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