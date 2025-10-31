const { pool } = require('../config/db');

class TourPrice {
    static async listByTour(tourId) {
        const [rows] = await pool.query(
            `SELECT id, tour_id, price_type, price, sale_price
             FROM Tour_Prices WHERE tour_id=? ORDER BY price_type`, [tourId]);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.query(
            `SELECT id, tour_id, price_type, price, sale_price
             FROM Tour_Prices WHERE id=? LIMIT 1`, [id]);
        return rows[0] || null;
    }

    static async create({ tour_id, price_type, price, sale_price }) {
        const [res] = await pool.query(
            `INSERT INTO Tour_Prices (tour_id, price_type, price, sale_price)
             VALUES (?,?,?,?)`,
            [tour_id, price_type, price, sale_price || null]
        );
        return this.findById(res.insertId);
    }

    static async update(id, { price_type, price, sale_price }) {
        await pool.query(
            `UPDATE Tour_Prices
             SET price_type=?, price=?, sale_price=?
             WHERE id=?`,
            [price_type, price, sale_price || null, id]
        );
        return this.findById(id);
    }

    static async remove(id) {
        await pool.query(`DELETE FROM Tour_Prices WHERE id=?`, [id]);
    }
}

module.exports = TourPrice;