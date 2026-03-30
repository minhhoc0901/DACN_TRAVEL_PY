const mysql = require('mysql2/promise');
require('dotenv').config();

// Cấu hình pool kết nối
let poolConfig;

if (process.env.DATABASE_URL) {
    // Nếu có DATABASE_URL (như trên Railway/Render)
    const url = new URL(process.env.DATABASE_URL);
    poolConfig = {
        host: url.hostname,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1).split('?')[0],
        port: parseInt(url.port || "3306"),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: '+07:00', // Ép múi giờ VN
        charset: 'utf8mb4'
    };
} else {
    // Nếu dùng các biến môi trường lẻ (Local)
    poolConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || "3306"),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: '+07:00',
        charset: 'utf8mb4'
    };
}

const pool = mysql.createPool(poolConfig);

/**
 * 💡 GIẢI PHÁP ĐỒNG BỘ MÚI GIỜ:
 * Vì mysql2 không tự động chạy SET time_zone khi dùng createPool, 
 * ta cần đảm bảo mọi kết nối đều được thiết lập múi giờ Việt Nam.
 */
const originalQuery = pool.query;
pool.query = async function (...args) {
    const connection = await pool.getConnection();
    try {
        await connection.query("SET time_zone = '+07:00'");
        return await connection.query(...args);
    } finally {
        connection.release();
    }
};

const originalExecute = pool.execute;
pool.execute = async function (...args) {
    const connection = await pool.getConnection();
    try {
        await connection.query("SET time_zone = '+07:00'");
        return await connection.execute(...args);
    } finally {
        connection.release();
    }
};

// Kiểm tra kết nối
async function checkConnection() {
    try {
        const connection = await pool.getConnection();
        await connection.query("SET time_zone = '+07:00'");
        const [rows] = await connection.query('SELECT NOW() as now');
        console.log('Kết nối MySQL thành công! Giờ DB hiện tại:', rows[0].now);
        connection.release();
    } catch (error) {
        console.error('Lỗi kết nối MySQL:', error.message);
    }
}

module.exports = { pool, checkConnection };