const { pool } = require('../config/db');
const { removeFromCloudinary, getPublicIdFromUrl } = require('../utils/cloudinaryHelper');

class Hotel {
    /**
     * Lấy tất cả khách sạn
     * @returns {Promise<Array>} Danh sách khách sạn
     */
    static async getAll() {
        const [rows] = await pool.query(
            `SELECT id, name, address, latitude, longitude, phone, email, 
                    website, rating, price_range, description, image, 
                    created_at, updated_at 
             FROM Hotels 
             ORDER BY name ASC`
        );
        return rows;
    }

    /**
     * Lấy khách sạn theo ID
     * @param {number} id - ID khách sạn
     * @returns {Promise<object|null>} Thông tin khách sạn
     */
    static async findById(id) {
        const [rows] = await pool.query(
            `SELECT * FROM Hotels WHERE id = ? LIMIT 1`,
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Tạo khách sạn mới
     * @param {object} data - Dữ liệu khách sạn
     * @returns {Promise<object>} Khách sạn vừa tạo
     */
    static async create(data) {
        const {
            name,
            address,
            latitude,
            longitude,
            phone,
            email,
            website,
            rating,
            price_range,
            description,
            image
        } = data;

        const [result] = await pool.query(
            `INSERT INTO Hotels 
             (name, address, latitude, longitude, phone, email, website, 
              rating, price_range, description, image) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                address || null,
                latitude || null,
                longitude || null,
                phone || null,
                email || null,
                website || null,
                rating || null,
                price_range || null,
                description || null,
                image || null
            ]
        );

        return this.findById(result.insertId);
    }

    /**
     * Cập nhật thông tin khách sạn
     * @param {number} id - ID khách sạn
     * @param {object} data - Dữ liệu cập nhật
     * @returns {Promise<object>} Khách sạn đã cập nhật
     */
    static async update(id, data) {
        const {
            name,
            address,
            latitude,
            longitude,
            phone,
            email,
            website,
            rating,
            price_range,
            description,
            image
        } = data;

        // Lấy thông tin khách sạn hiện tại để xử lý ảnh
        const existingHotel = await this.findById(id);
        if (!existingHotel) {
            throw new Error('Không tìm thấy khách sạn để cập nhật');
        }

        // Xử lý xóa ảnh cũ trên Cloudinary nếu có ảnh mới
        if (image && image !== existingHotel.image && existingHotel.image && existingHotel.image.includes('cloudinary')) {
            const oldPid = getPublicIdFromUrl(existingHotel.image);
            if (oldPid) await removeFromCloudinary(oldPid);
        }

        await pool.query(
            `UPDATE Hotels 
             SET name = ?, address = ?, latitude = ?, longitude = ?, 
                 phone = ?, email = ?, website = ?, rating = ?, 
                 price_range = ?, description = ?, image = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                name,
                address || null,
                latitude || null,
                longitude || null,
                phone || null,
                email || null,
                website || null,
                rating || null,
                price_range || null,
                description || null,
                image || null,
                id
            ]
        );

        return this.findById(id);
    }

    /**
     * Xóa khách sạn
     * @param {number} id - ID khách sạn
     * @returns {Promise<boolean>} Kết quả xóa
     */
    static async delete(id) {
        // Lấy thông tin khách sạn để xóa ảnh trên Cloudinary
        const hotel = await this.findById(id);
        if (hotel && hotel.image && hotel.image.includes('cloudinary')) {
            const pid = getPublicIdFromUrl(hotel.image);
            if (pid) await removeFromCloudinary(pid);
        }

        const [result] = await pool.query(
            `DELETE FROM Hotels WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    /**
     * Tìm kiếm khách sạn theo tên
     * @param {string} keyword - Từ khóa tìm kiếm
     * @returns {Promise<Array>} Danh sách khách sạn
     */
    static async search(keyword) {
        const [rows] = await pool.query(
            `SELECT * FROM Hotels 
             WHERE name LIKE ? OR address LIKE ?
             ORDER BY name ASC`,
            [`%${keyword}%`, `%${keyword}%`]
        );
        return rows;
    }

    /**
     * Lấy khách sạn theo location
     * @param {number} locationId - ID địa điểm
     * @returns {Promise<Array>} Danh sách khách sạn gần địa điểm
     */
    static async getByLocation(locationId) {
        const [rows] = await pool.query(
            `SELECT h.* 
             FROM Hotels h
             INNER JOIN LocationHotels lh ON h.id = lh.hotel_id
             WHERE lh.location_id = ?
             ORDER BY h.name ASC`,
            [locationId]
        );
        return rows;
    }
}

module.exports = Hotel;