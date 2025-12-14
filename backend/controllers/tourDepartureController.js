const TourDeparture = require('../models/TourDeparture');

// [PUBLIC] Lấy danh sách lịch khởi hành còn trống cho một tour
exports.getAvailableDepartures = async (req, res) => {
    try {
        const { tourId } = req.params;
        const departures = await TourDeparture.findAvailableByTour(tourId);
        res.status(200).json({ success: true, data: departures });
    } catch (error) {
        
        console.error('[GET AVAILABLE DEPARTURES] Error:', error); 
        
        res.status(500).json({ success: false, message: 'Lỗi khi lấy lịch khởi hành.' });
    }
};

// [ADMIN] Lấy tất cả lịch khởi hành của một tour
exports.getAllDeparturesForTour = async (req, res) => {
    try {
        const { tourId } = req.params;
        const departures = await TourDeparture.listByTour(tourId);
        res.status(200).json({ success: true, data: departures });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lịch khởi hành.' });
    }
};

// [ADMIN] Tạo một lịch khởi hành mới
exports.createDeparture = async (req, res) => {
    try {
        const newDeparture = await TourDeparture.create(req.body);
        res.status(201).json({ success: true, data: newDeparture });
    } catch (error) {
        // Xử lý lỗi trùng ngày khởi hành
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Ngày khởi hành này đã tồn tại cho tour.' });
        }
        res.status(500).json({ success: false, message: 'Lỗi khi tạo lịch khởi hành.' });
    }
};

// [ADMIN] Cập nhật một lịch khởi hành
exports.updateDeparture = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedDeparture = await TourDeparture.update(id, req.body);
        if (!updatedDeparture) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch khởi hành.' });
        }
        res.status(200).json({ success: true, data: updatedDeparture });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật lịch khởi hành.' });
    }
};

// [ADMIN] Xóa một lịch khởi hành
exports.deleteDeparture = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await TourDeparture.remove(id);
        if (!success) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch khởi hành.' });
        }
        res.status(200).json({ success: true, message: 'Đã xóa lịch khởi hành thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa lịch khởi hành.' });
    }
};