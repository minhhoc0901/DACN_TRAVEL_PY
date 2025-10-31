const { pool }  = require('../config/db');

class Promotion {
    static async getByCodeForUpdate(code, conn) {
        const [rows] = await conn.query(
            `SELECT * FROM Promotions 
             WHERE code=? AND is_active=1 
               AND NOW() BETWEEN start_date AND end_date
             FOR UPDATE`,
            [code]
        );
        return rows[0] || null;
    }

    static async incrementUsage(id, conn) {
        await conn.query(
            `UPDATE Promotions 
             SET usage_count = usage_count + 1 
             WHERE id=? AND (max_usage IS NULL OR usage_count < max_usage)`,
            [id]
        );
    }

    static async listActive() {
        const [rows] = await pool.query(
            `SELECT * FROM Promotions 
             WHERE is_active=1 AND NOW() BETWEEN start_date AND end_date
             ORDER BY end_date ASC`
        );
        return rows;
    }

    static async listAll() {
        const [rows] = await pool.query(`SELECT * FROM Promotions ORDER BY id DESC`);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.query(`SELECT * FROM Promotions WHERE id=? LIMIT 1`, [id]);
        return rows[0] || null;
    }

    static async findByCode(code) {
        const [rows] = await pool.query(`SELECT * FROM Promotions WHERE code=? LIMIT 1`, [code]);
        return rows[0] || null;
    }

    static async create(data) {
        const {
            code, description, discount_type, discount_value,
            start_date, end_date, max_usage, is_active
        } = data;
        const [res] = await pool.query(
            `INSERT INTO Promotions
             (code, description, discount_type, discount_value, start_date, end_date, max_usage, is_active)
             VALUES (?,?,?,?,?,?,?,?)`,
            [code, description || null, discount_type, discount_value, start_date, end_date, max_usage || null, is_active ?? true]
        );
        return this.findById(res.insertId);
    }

    static async update(id, data) {
        const {
            code, description, discount_type, discount_value,
            start_date, end_date, max_usage, is_active
        } = data;
        await pool.query(
            `UPDATE Promotions SET
             code=?, description=?, discount_type=?, discount_value=?, start_date=?, end_date=?,
             max_usage=?, is_active=? WHERE id=?`,
            [code, description || null, discount_type, discount_value, start_date, end_date,
             max_usage || null, is_active ?? true, id]
        );
        return this.findById(id);
    }

    static async remove(id) {
        await pool.query(`DELETE FROM Promotions WHERE id=?`, [id]);
    }
    static async findByCode(code) {
        const [rows] = await pool.query(
            'SELECT * FROM promotions WHERE code = ? AND is_active = 1',
            [code]
        );
        return rows[0]; // Trả về dòng đầu tiên tìm được
    }
}

module.exports = Promotion;