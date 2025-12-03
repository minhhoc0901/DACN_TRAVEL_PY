const Hotel = require('../models/Hotel');
const path = require('path');

/**
 * Lấy tất cả khách sạn
 * @route GET /api/hotels
 */
exports.getAllHotels = async (req, res) => {
    try {
        const hotels = await Hotel.getAll();
        res.json({
            success: true,
            data: hotels
        });
    } catch (error) {
        console.error('[Hotel] getAllHotels error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách khách sạn',
            error: error.message
        });
    }
};

/**
 * Lấy thông tin một khách sạn
 * @route GET /api/hotels/:id
 */
exports.getHotelById = async (req, res) => {
    try {
        const { id } = req.params;
        const hotel = await Hotel.findById(id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách sạn'
            });
        }

        res.json({
            success: true,
            data: hotel
        });
    } catch (error) {
        console.error('[Hotel] getHotelById error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin khách sạn',
            error: error.message
        });
    }
};

/**
 * Tạo khách sạn mới
 * @route POST /api/hotels
 */
exports.createHotel = async (req, res) => {
    try {
        const hotelData = req.body;

        // Validate required fields
        if (!hotelData.name) {
            return res.status(400).json({
                success: false,
                message: 'Tên khách sạn là bắt buộc'
            });
        }

        // Xử lý file ảnh nếu có
        if (req.files && req.files.image) {
            const file = req.files.image;
            
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: 'Loại file không hợp lệ. Chỉ chấp nhận JPEG, PNG, GIF, WEBP.'
                });
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: 'Kích thước file quá lớn. Tối đa 5MB.'
                });
            }

            const fileName = `${Date.now()}-${file.name}`;
            const uploadPath = path.join(__dirname, '../uploads/hotels', fileName);

            await file.mv(uploadPath);
            hotelData.image = `/uploads/hotels/${fileName}`;
        }

        const newHotel = await Hotel.create(hotelData);

        res.status(201).json({
            success: true,
            message: 'Tạo khách sạn thành công',
            data: newHotel
        });
    } catch (error) {
        console.error('[Hotel] createHotel error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo khách sạn',
            error: error.message
        });
    }
};

/**
 * Cập nhật thông tin khách sạn
 * @route PUT /api/hotels/:id
 */
exports.updateHotel = async (req, res) => {
    try {
        const { id } = req.params;
        const hotelData = req.body;

        // Kiểm tra khách sạn tồn tại
        const existingHotel = await Hotel.findById(id);
        if (!existingHotel) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách sạn'
            });
        }

        // Xử lý file ảnh mới nếu có
        if (req.files && req.files.image) {
            const file = req.files.image;
            
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: 'Loại file không hợp lệ'
                });
            }

            if (file.size > 5 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: 'Kích thước file quá lớn'
                });
            }

            const fileName = `${Date.now()}-${file.name}`;
            const uploadPath = path.join(__dirname, '../uploads/hotels', fileName);

            await file.mv(uploadPath);
            hotelData.image = `/uploads/hotels/${fileName}`;
        } else if (!hotelData.image) {
            // Giữ nguyên ảnh cũ nếu không có ảnh mới
            hotelData.image = existingHotel.image;
        }

        const updatedHotel = await Hotel.update(id, hotelData);

        res.json({
            success: true,
            message: 'Cập nhật khách sạn thành công',
            data: updatedHotel
        });
    } catch (error) {
        console.error('[Hotel] updateHotel error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật khách sạn',
            error: error.message
        });
    }
};

/**
 * Xóa khách sạn
 * @route DELETE /api/hotels/:id
 */
exports.deleteHotel = async (req, res) => {
    try {
        const { id } = req.params;

        const hotel = await Hotel.findById(id);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách sạn'
            });
        }

        const success = await Hotel.delete(id);

        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa khách sạn'
            });
        }

        res.json({
            success: true,
            message: 'Đã xóa khách sạn thành công'
        });
    } catch (error) {
        console.error('[Hotel] deleteHotel error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa khách sạn',
            error: error.message
        });
    }
};

/**
 * Tìm kiếm khách sạn
 * @route GET /api/hotels/search/:keyword
 */
exports.searchHotels = async (req, res) => {
    try {
        const { keyword } = req.params;
        const hotels = await Hotel.search(keyword);

        res.json({
            success: true,
            data: hotels
        });
    } catch (error) {
        console.error('[Hotel] searchHotels error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tìm kiếm khách sạn',
            error: error.message
        });
    }
};

/**
 * Lấy khách sạn theo địa điểm
 * @route GET /api/hotels/location/:locationId
 */
exports.getHotelsByLocation = async (req, res) => {
    try {
        const { locationId } = req.params;
        const hotels = await Hotel.getByLocation(locationId);

        res.json({
            success: true,
            data: hotels
        });
    } catch (error) {
        console.error('[Hotel] getHotelsByLocation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách khách sạn theo địa điểm',
            error: error.message
        });
    }
};