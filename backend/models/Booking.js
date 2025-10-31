const { pool }  = require('../config/db');

class Booking {
    static async create(conn, {
        userId, tourId, startDate,
        originalAmount, finalAmount, discountAmount,
        promotionId, contact
    }) {
        const [res] = await conn.query(
            `INSERT INTO Bookings
             (user_id, tour_id, start_date, original_amount, final_amount, discount_amount,
              promotion_id, contact_name, contact_email, contact_phone, special_requests)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [
                userId, tourId, startDate, originalAmount, finalAmount, discountAmount,
                promotionId || null, contact.name, contact.email, contact.phone, contact.special || null
            ]
        );
        return res.insertId;
    }

    static async findById(id) {
        const [rows] = await pool.query(`SELECT * FROM Bookings WHERE id=?`, [id]);
        return rows[0] || null;
    }

    static async updateStatus(id, status) {
        await pool.query(`UPDATE Bookings SET status=? WHERE id=?`, [status, id]);
    }
    static async findByUser(userId) {
        const [rows] = await pool.query(
            `SELECT 
                b.*, 
                t.destination AS tour_name, 
                t.image AS tour_image,
                latest_payment.payment_status,
                (SELECT GROUP_CONCAT(
                    JSON_OBJECT(
                        'price_type', bd.price_type, 
                        'quantity', bd.quantity, 
                        'unit_price', bd.unit_price
                    )
                ) 
                FROM booking_details bd 
                WHERE bd.booking_id = b.id
                ) AS details
            FROM 
                bookings b
            JOIN 
                tours t ON b.tour_id = t.id
            LEFT JOIN 
                (
                    SELECT 
                        booking_id, 
                        payment_status,
                        ROW_NUMBER() OVER(PARTITION BY booking_id ORDER BY updated_at DESC) as rn
                    FROM 
                        payments
                ) AS latest_payment ON b.id = latest_payment.booking_id AND latest_payment.rn = 1
            WHERE 
                b.user_id = ?
            ORDER BY 
                b.created_at DESC`,
            [userId]
        );
        
        // Chuyển đổi chuỗi JSON 'details' thành một mảng object
        return rows.map(row => ({
            ...row,
            details: row.details ? JSON.parse(`[${row.details}]`) : []
        }));
    }
    static async cancelByUser(bookingId, userId) {
        const [result] = await pool.query(
            `UPDATE bookings 
             SET status = 'cancelled' 
             WHERE id = ? AND user_id = ? AND status = 'pending_payment'`,
            [bookingId, userId]
        );
        return result.affectedRows;
    }
    static async deleteByUser(bookingId, userId) {
        // ON DELETE CASCADE sẽ tự động xóa các bản ghi liên quan trong 
        // booking_details và payments.
        const [result] = await pool.query(
            `DELETE FROM bookings 
             WHERE id = ? AND user_id = ? AND status != 'confirmed'`,
            [bookingId, userId]
        );
        return result.affectedRows;
    }
}

module.exports = Booking;