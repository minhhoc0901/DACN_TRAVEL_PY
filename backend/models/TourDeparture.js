const { pool } = require('../config/db');

class TourDeparture {
    /**
     * Lấy tất cả lịch khởi hành của một tour (dành cho admin)
     */
    static async listByTour(tourId) {
        const [rows] = await pool.query(
            `SELECT id, tour_id, departure_date, end_date, capacity, slots_booked, status 
             FROM tour_departures WHERE tour_id = ? ORDER BY departure_date DESC`,
            [tourId]
        );
        return rows;
    }


    /**
     * Tìm một lịch khởi hành bằng ID
     */
    static async findById(id, connection = pool) {
        const [rows] = await connection.query(
            `SELECT * FROM tour_departures WHERE id = ? LIMIT 1`,
            [id]
        );
        return rows[0] || null;
    }

    /**
     * ✅ Tạo lịch khởi hành mới - TỰ ĐỘNG TÍNH END_DATE
     */
    static async create({ tour_id, departure_date, capacity, status = 'OPEN' }) {
        // ✅ Lấy duration từ Tours
        const [tourRows] = await pool.query(
            'SELECT duration FROM tours WHERE id = ?',
            [tour_id]
        );

        if (!tourRows || tourRows.length === 0) {
            throw new Error('Tour không tồn tại');
        }

        const duration = tourRows[0].duration;
        
        // ✅ Tính end_date
        let end_date = null;
        if (duration) {
            const days = parseInt(duration.split(' ')[0]) || 1;
            const departureDate = new Date(departure_date);
            const endDate = new Date(departureDate);
            endDate.setDate(departureDate.getDate() + days - 1);
            end_date = endDate.toISOString().split('T')[0];
        }

        // ✅ Insert với đầy đủ thông tin
        const [result] = await pool.query(
            `INSERT INTO tour_departures 
             (tour_id, departure_date, duration, end_date, capacity, status) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [tour_id, departure_date, duration, end_date, capacity, status]
        );
        
        return this.findById(result.insertId);
    }

    /**
     * ✅ Cập nhật lịch khởi hành - TỰ ĐỘNG TÍNH LẠI END_DATE
     */
    static async update(id, { departure_date, capacity, status }) {
        // ✅ Lấy duration từ bản ghi hiện tại
        const current = await this.findById(id);
        
        if (!current) {
            throw new Error('Lịch khởi hành không tồn tại');
        }

        // ✅ Tính lại end_date nếu departure_date thay đổi
        let end_date = current.end_date;
        if (departure_date && departure_date !== current.departure_date && current.duration) {
            const days = parseInt(current.duration.split(' ')[0]) || 1;
            const departureDate = new Date(departure_date);
            const endDate = new Date(departureDate);
            endDate.setDate(departureDate.getDate() + days - 1);
            end_date = endDate.toISOString().split('T')[0];
        }

        await pool.query(
            `UPDATE tour_departures 
             SET departure_date = ?, end_date = ?, capacity = ?, status = ? 
             WHERE id = ?`,
            [departure_date, end_date, capacity, status, id]
        );
        
        return this.findById(id);
    }

    /**
     * Xóa một lịch khởi hành
     */
    static async remove(id) {
        const [result] = await pool.query(`DELETE FROM tour_departures WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }

    /**
     * Tìm một lịch khởi hành và khóa nó để cập nhật trong transaction.
     * Đây là hàm cốt lõi để chống bán lố vé.
     * @param {number} departureId - ID của lịch khởi hành.
     * @param {object} connection - Đối tượng connection từ transaction.
     * @returns {Promise<object|null>} - Trả về object departure hoặc null nếu không tìm thấy/không hợp lệ.
     */
    static async findAndLockForUpdate(departureId, connection) {
        if (!connection) throw new Error("Hàm này phải được gọi trong một transaction.");
        
        const [rows] = await connection.execute(
            `SELECT id, capacity, slots_booked, status 
             FROM tour_departures 
             WHERE id = ? AND status = 'OPEN' 
             FOR UPDATE`,
            [departureId]
        );
        return rows[0] || null;
    }

    /**
     * Tăng số lượng vé đã đặt cho một lịch khởi hành.
     * @param {number} departureId - ID của lịch khởi hành.
     * @param {number} quantity - Số lượng vé cần tăng.
     * @param {object} connection - Đối tượng connection để chạy trong transaction.
     */
    static async increaseSlotsBooked(departureId, quantity, connection) {
        if (!connection) throw new Error("Hàm này phải được gọi trong một transaction.");
        await connection.execute(
            `UPDATE tour_departures SET slots_booked = slots_booked + ? WHERE id = ?`,
            [quantity, departureId]
        );
    }

    /**
     * Giảm số lượng vé đã đặt cho một lịch khởi hành (khi hủy đơn).
     * @param {number} departureId - ID của lịch khởi hành.
     * @param {number} quantity - Số lượng vé cần giảm.
     * @param {object} connection - Đối tượng connection để chạy trong transaction.
     */
    static async restoreSlots(departureId, slotsToRestore, connection) {
        if (slotsToRestore <= 0) return; // Không làm gì nếu không có chỗ nào để hoàn trả

        const sql = `
            UPDATE tour_departures 
            SET slots_booked = GREATEST(0, slots_booked - ?) 
            WHERE id = ?
        `;
        // GREATEST(0, ...) để đảm bảo slots_booked không bao giờ bị âm
        await connection.execute(sql, [slotsToRestore, departureId]);
    }
    /**
     * Tìm tất cả các lịch khởi hành còn trống và trong tương lai của một tour.
     * @param {number} tourId
     */
    static async findAvailableByTour(tourId) {
        const [rows] = await pool.execute(
            `SELECT 
                id, 
                departure_date, 
                (capacity - slots_booked) AS slots_available 
             FROM tour_departures 
             WHERE tour_id = ? AND status = 'OPEN' AND departure_date >= CURDATE()
             ORDER BY departure_date ASC`,
            [tourId]
        );
        return rows;
    }
}

module.exports = TourDeparture;