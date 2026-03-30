require('dotenv').config();
const { pool } = require('./config/db');
process.env.TZ = 'Asia/Ho_Chi_Minh';

async function checkTimezone() {
    console.log('--- FINAL TIMEZONE CHECK ---');
    console.log('Node.js TZ:', process.env.TZ);
    console.log('Node.js Date (toString):', new Date().toString());
    
    try {
        const [rows] = await pool.query('SELECT NOW() as db_now, @@system_time_zone, @@time_zone');
        console.log('Database Result:', rows[0]);
    } catch (err) {
        console.error('Database Error:', err.message);
    }
    
    process.exit(0);
}

checkTimezone();
