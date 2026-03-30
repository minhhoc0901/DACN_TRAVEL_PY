const fs = require('fs');
const path = require('path');
const Tour = require('../models/Tour');
const Notification = require('../models/Notification'); 
const NOTIFICATION_TYPES = require('../constants/notificationTypes');
const NotificationService = require('../utils/notificationService');
const { pool } = require('../config/db');
const { uploadToCloudinary, removeFromCloudinary, getPublicIdFromUrl } = require('../utils/cloudinaryHelper');
const { 
  createTour, 
  getAllTours, 
  getTourById, 
  updateTour, 
  deleteTour,
  getToursByLocation,
  updateTourStatus,
  getToursByStatus,
  getToursByUser,
  hideTour,
  restoreTour,
  
} = require('../models/Tour');



/**
 * Khôi phục một tour đã bị ẩn
 * @route PUT /api/tours/admin/tours/:id/restore
 */
exports.restoreTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    
    // 1. Lấy thông tin tour
    const tour = await getTourById(tourId);
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found' });
    }

    // 2. Khôi phục tour (đồng thời đặt status = 'pending')
    const success = await restoreTour(tourId);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tour để khôi phục' });
    }

    // GỬI THÔNG BÁO CHO NGƯỜI TẠO TOUR
    if (tour.user_id) {
      const io = req.app.get('io');
      await NotificationService.notifyTourRestored(
        io, 
        tour.user_id, 
        tour.id, 
        tour.destination
      );
    }

    res.status(200).json({ success: true, message: 'Tour đã được khôi phục thành công và đặt lại về trạng thái "Chờ duyệt"' });
  } catch (error) {
    console.error('Error restoring tour:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi khôi phục tour' });
  }
};
exports.hideTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    
    if (!tourId || isNaN(parseInt(tourId))) {
      return res.status(400).json({ success: false, message: 'Invalid tour ID' });
    }
    
    // 1. Lấy thông tin tour
    const tour = await getTourById(tourId);
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found' });
    }
    
    // 2. Kiểm tra quyền
    if (req.user.role !== 'admin' && tour.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này.' });
    }

    // 3. Ẩn tour (đồng thời đặt status = 'rejected')
    const success = await hideTour(tourId);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tour để ẩn' });
    }

    // GỬI THÔNG BÁO QUA SERVICE - CHỈ 1 DÒNG
    if (tour.user_id) {
      const io = req.app.get('io');
      await NotificationService.notifyTourHidden(
        io, 
        tour.user_id, 
        tour.id, 
        tour.destination
      );
    }

    res.status(200).json({ success: true, message: 'Tour đã được ẩn và chuyển sang trạng thái "Từ chối" thành công' });
  } catch (error) {
    console.error('Error hiding tour:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi ẩn tour' });
  }
};

/**
 * Tạo một tour mới
 * @route POST /api/tours
 */
exports.createTour = async (req, res) => {
  try {
    const tourData = req.body;
    
    // Kiểm tra các trường bắt buộc
    if (!tourData.destination || !tourData.departure_from || !tourData.duration || !tourData.description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: destination, departure_from, duration, description' 
      });
    }
    // --- CLOUDINARY UPLOAD ---
    if (req.files && req.files.image) {
      const file = req.files.image;
      const cloudResult = await uploadToCloudinary(file.data, 'tours');
      tourData.image = cloudResult.url;
    } else {
      // Nếu không có ảnh, sử dụng ảnh mặc định
      tourData.image = 'https://res.cloudinary.com/dapsnr3xi/image/upload/v1711786000/travel_phuyen/tours/default-tour.jpg'; // Cần tạo ảnh mặc định trên Cloudinary
    }

    // Parse các trường dạng mảng từ chuỗi JSON
    const fieldsToProcess = ['highlights', 'schedule', 'includes', 'excludes', 'notes', 'selected_location_ids'];
    
    fieldsToProcess.forEach(field => {
      if (typeof tourData[field] === 'string') {
        try {
          tourData[field] = JSON.parse(tourData[field]);
          console.log(`Parsed ${field}:`, tourData[field]);
        } catch (e) {
          console.warn(`Failed to parse ${field} as JSON:`, e);
          tourData[field] = field === 'schedule' ? [] : [];
        }
      }
    });

    // Kiểm tra lịch trình và địa điểm
    if (!tourData.schedule || !Array.isArray(tourData.schedule) || tourData.schedule.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tour schedule is required and must be an array' 
      });
    }

    // Thêm location_ids nếu có selected_location_ids nhưng không có location_ids
    if (tourData.selected_location_ids && !tourData.location_ids) {
      tourData.location_ids = tourData.selected_location_ids;
    }

    // Kiểm tra từng lịch trình có địa điểm không
    for (const [index, sched] of tourData.schedule.entries()) {
      if (!sched.day || !sched.title) {
        return res.status(400).json({
          success: false,
          message: `Schedule at index ${index} is missing required fields: day, title`
        });
      }
      
      // Đảm bảo locations là một mảng (nếu có)
      if (!sched.locations || !Array.isArray(sched.locations)) {
        sched.locations = [];
      }
      
      // Đảm bảo activities là một mảng (nếu có)
      if (!sched.activities || !Array.isArray(sched.activities)) {
        sched.activities = [];
      }
    }

    // Thêm trạng thái mặc định là 'pending' và user_id (nếu có)
    tourData.status = 'pending';
    
    // Lấy user_id từ token auth (nếu có)
    if (req.user) {
      tourData.user_id = req.user.id;
    }

    // Log dữ liệu trước khi lưu vào DB
    console.log('Tour data to save:', {
      destination: tourData.destination,
      highlights: tourData.highlights?.length,
      schedule: tourData.schedule?.length,
      includes: tourData.includes?.length,
      excludes: tourData.excludes?.length,
      notes: tourData.notes?.length
    });

    const tourId = await createTour(tourData);

    //GỬI THÔNG BÁO CHO ADMIN
    const io = req.app.get('io');
    const adminIds = await NotificationService.getAdminIds();

    const userId = req.user?.id || tourData.user_id;
    
    if (userId) {
      const [userInfo] = await pool.query(
        'SELECT full_name, username FROM users WHERE id = ?',
        [userId]  
      );

      await NotificationService.notifyAdminNewTour(
        io,
        adminIds,
        tourId,
        {
          destination: tourData.destination,
          userName: userInfo[0]?.full_name || userInfo[0]?.username || 'Unknown',
          duration: tourData.duration,
          departureFrom: tourData.departure_from
        }
      );
    } else {
      console.warn('[createTour] ⚠️ No userId found, skipping notification');
    }
    

    res.status(201).json({ 
      success: true, 
      message: 'Tour created successfully', 
      tourId 
    });
  } catch (error) {
    console.error('Error creating tour:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating tour', 
      error: error.message 
    });
  }
};

/**
 * Lấy tất cả tour (chỉ tour đã được phê duyệt)
 * @route GET /api/tours
 */
exports.getAllTours = async (req, res) => {
  try {

    // Tham số đầu tiên (true) để lấy tất cả status
    // Tham số thứ hai (true) để lấy cả tour không hoạt động (is_active = FALSE)
    const tours = await getAllTours(false,true); // false để chỉ lấy tour đã phê duyệt
    res.status(200).json({ 
      success: true, 
      tours 
    });
  } catch (error) {
    console.error('Error fetching tours:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tours', 
      error: error.message 
    });
  }
};

/**
 * Admin: Lấy tất cả tour kể cả chưa phê duyệt
 * @route GET /api/admin/tours
 */
exports.getAdminTours = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập - Yêu cầu quyền Admin'
      });
    }
    
    console.log('[getAdminTours] Admin user:', req.user.id, 'requesting all tours');
    
    const allTours = await getAllTours(true, true);
    
    console.log(`[getAdminTours] ✅ Trả về tổng cộng ${allTours.length} tours`);
    
    // ✅ LOG CHI TIẾT 3 TOUR ĐẦU TIÊN
    console.log('[getAdminTours] Sample tours being sent to frontend:');
    allTours.slice(0, 3).forEach(t => {
      console.log(`  - Tour ${t.id}: is_active=${t.is_active} (type: ${typeof t.is_active}), status=${t.status}`);
    });
    
    res.status(200).json({ 
      success: true, 
      tours: allTours 
    });
  } catch (error) {
    console.error('[getAdminTours] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching admin tours',
      error: error.message
    });
  }
};

/**
 * Lấy tour của người dùng hiện tại 
 * @route GET /api/user/tours
 */
exports.getUserTours = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User not logged in'
      });
    }

    console.log('Fetching tours for user:', req.user.id);
    
    // Lấy tour của người dùng thông qua userId
    const userTours = await getToursByUser(req.user.id, true);

    res.status(200).json({
      success: true,
      tours: userTours
    });
  } catch (error) {
    console.error('Error fetching user tours:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user tours',
      error: error.message
    });
  }
};

/**
 * Admin: Cập nhật trạng thái của tour
 * @route PUT /api/admin/tours/:id/status
 */
exports.updateTourStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Phải là "pending", "approved", hoặc "rejected"'
      });
    }
    
    const success = await updateTourStatus(id, status);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Tour không tìm thấy'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Trạng thái tour đã được cập nhật thành ${status}`
    });
  } catch (error) {
    console.error('Error updating tour status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái tour',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin một tour theo ID
 * @route GET /api/tours/:id
 */
exports.getTourById = async (req, res) => {
  try {
    const tourId = req.params.id;
    
    if (!tourId || isNaN(parseInt(tourId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID'
      });
    }
    
    const tour = await getTourById(tourId);
    if (!tour) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tour not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      tour 
    });
  } catch (error) {
    console.error('Error fetching tour:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tour', 
      error: error.message 
    });
  }
};

/**
 * Cập nhật thông tin một tour
 * @route PUT /api/tours/:id
 */
exports.updateTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const tourData = req.body;

    console.log('[updateTour] Received data:', {
      tourId,
      hasFiles: !!req.files,
      imageField: req.files?.image,
      bodyKeys: Object.keys(tourData)
    });

    // Kiểm tra xem dữ liệu đã là object hay chưa
    // Nếu là string, thử parse JSON
    if (typeof tourData.highlights === 'string') {
      try {
        tourData.highlights = JSON.parse(tourData.highlights);
      } catch (e) {
        console.warn('Failed to parse highlights as JSON:', e);
      }
    }

    if (typeof tourData.schedule === 'string') {
      try {
        tourData.schedule = JSON.parse(tourData.schedule);
      } catch (e) {
        console.warn('Failed to parse schedule as JSON:', e);
      }
    }

    if (typeof tourData.includes === 'string') {
      try {
        tourData.includes = JSON.parse(tourData.includes);
      } catch (e) {
        console.warn('Failed to parse includes as JSON:', e);
      }
    }

    if (typeof tourData.excludes === 'string') {
      try {
        tourData.excludes = JSON.parse(tourData.excludes);
      } catch (e) {
        console.warn('Failed to parse excludes as JSON:', e);
      }
    }

    if (typeof tourData.notes === 'string') {
      try {
        tourData.notes = JSON.parse(tourData.notes);
      } catch (e) {
        console.warn('Failed to parse notes as JSON:', e);
      }
    }

    if (typeof tourData.selected_location_ids === 'string') {
      try {
        tourData.selected_location_ids = JSON.parse(tourData.selected_location_ids);
      } catch (e) {
        console.warn('Failed to parse selected_location_ids as JSON:', e);
      }
    }

    // ✅ QUAN TRỌNG: Chỉ xử lý ảnh mới nếu có file được upload
    if (req.files && req.files.image) {
      const file = req.files.image;
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
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

      // --- CLOUDINARY UPLOAD ---
      // Lấy thông tin tour hiện tại để xóa ảnh cũ
      const currentTour = await Tour.getTourById(tourId);
      if (currentTour && currentTour.image && currentTour.image.includes('cloudinary')) {
        const oldPublicId = getPublicIdFromUrl(currentTour.image);
        if (oldPublicId) await removeFromCloudinary(oldPublicId);
      }

      const cloudResult = await uploadToCloudinary(file.data, 'tours');
      tourData.image = cloudResult.url;
      
      console.log('[updateTour] New image uploaded to Cloudinary:', tourData.image);
    } else {
      // ✅ Nếu không có file mới, GIỮ NGUYÊN ảnh cũ bằng cách xóa field image
      // Backend sẽ không update field image trong database
      delete tourData.image;
      console.log('[updateTour] No new image uploaded, keeping existing image');
    }

    // Validate required fields
    if (!tourData.destination || !tourData.departure_from || 
        !tourData.duration || !tourData.description) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu các trường bắt buộc (destination, departure_from, duration, description)'
      });
    }

    // Validate schedule
    if (!Array.isArray(tourData.schedule) || tourData.schedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lịch trình không hợp lệ hoặc trống'
      });
    }

    // Reset status to 'pending' if the tour is being updated by non-admin
    if (req.user && req.user.role !== 'admin') {
      tourData.status = 'pending';
      console.log('[updateTour] User is not admin, setting status to pending');
    }

    // Perform update
    const success = await Tour.updateTour(tourId, tourData);

    if (success) {
      // Fetch updated tour
      const updatedTour = await Tour.getTourById(tourId);
      
      res.json({
        success: true,
        message: 'Cập nhật tour thành công',
        tour: updatedTour
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Không thể cập nhật tour'
      });
    }
  } catch (error) {
    console.error('[updateTour] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật tour',
      error: error.message
    });
  }
};

/**
 * Xóa một tour
 * @route DELETE /api/tours/:id
 */
exports.deleteTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    
    if (!tourId || isNaN(parseInt(tourId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID'
      });
    }
    
    // Kiểm tra quyền xóa tour - nếu là admin với ID 1, chỉ được xóa tour của mình
    if (req.user && req.user.role === 'admin' && req.user.id === 1) {
      // Lấy thông tin tour để kiểm tra
      const tour = await getTourById(tourId);
      if (!tour) {
        return res.status(404).json({ 
          success: false, 
          message: 'Tour not found' 
        });
      }
      
      // Nếu admin với ID 1 cố gắng xóa tour không phải của mình
      if (parseInt(tour.user_id) !== 1) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa tour này'
        });
      }
    }
    
    const success = await deleteTour(tourId);
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tour not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Tour deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting tour:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting tour', 
      error: error.message 
    });
  }
};

/**
 * Lấy tất cả tour có chứa một địa điểm cụ thể
 * @route GET /api/tours/location/:id
 */
exports.getToursByLocation = async (req, res) => {
  try {
    const locationId = req.params.id;
    
    if (!locationId || isNaN(parseInt(locationId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }
    
    // Chỉ lấy các tour đã được phê duyệt
    const tours = await getToursByLocation(locationId, true);
    res.status(200).json({ 
      success: true, 
      tours 
    });
  } catch (error) {
    console.error('Error fetching tours by location:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tours by location', 
      error: error.message 
    });
  }
};

/**
 * Lấy danh sách ảnh từ thư mục uploads/tours
 * @route GET /api/tours/images
 */
exports.getTourImages = async (req, res) => {
  try {
    // Thay vì quét thư mục local, ta lấy tất cả ảnh tour từ Database
    const [rows] = await pool.query('SELECT DISTINCT image FROM tours WHERE image IS NOT NULL');
    
    // Tạo cấu trúc dữ liệu tương thích
    const images = rows.map(row => ({
      name: row.image.split('/').pop(),
      url: row.image,
      createdAt: new Date(),
    }));
    
    res.status(200).json({
      success: true,
      images: images
    });
  } catch (error) {
    console.error('Error fetching tour images from DB:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách ảnh từ DB',
      error: error.message
    });
  }
};

/**
 * Upload ảnh tour lên server
 * @route POST /api/tours/upload-image
 */
exports.uploadTourImage = async (req, res) => {
  try {
    // Kiểm tra xem có file nào được upload không
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có file nào được upload'
      });
    }

    const tourImage = req.files.image;
    
    // Kiểm tra loại file
    const fileExt = tourImage.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng file không được hỗ trợ. Vui lòng upload file ảnh (jpg, jpeg, png, gif, webp)'
      });
    }
    
    // Giới hạn kích thước file (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (tourImage.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Kích thước file quá lớn. Giới hạn tối đa 5MB'
      });
    }
    
    // --- CLOUDINARY UPLOAD ---
    const cloudResult = await uploadToCloudinary(tourImage.data, 'tours');
    
    // Trả về thông tin file đã upload
    res.status(200).json({
      success: true,
      message: 'Upload lên Cloudinary thành công',
      imageUrl: cloudResult.url,
      public_id: cloudResult.public_id,
      size: tourImage.size
    });
  } catch (error) {
    console.error('Error uploading tour image:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload ảnh',
      error: error.message
    });
  }
};

/**
 * Lấy tất cả tour cho admin với khả năng lọc theo user_id
 * @route GET /api/tours/admin/all
 */
exports.getAllToursForAdmin = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập - Yêu cầu quyền Admin'
      });
    }
    
    console.log('Admin user requesting all tours with filtering:', req.user.id);
    
    // Lấy tất cả tour
    let allTours = await getAllTours(true,false); // true để lấy tất cả các trạng thái
    
    // Nếu admin là user_id=1, chỉ hiển thị tour của mình
    if (req.user.id === 1) {
      console.log('Filtering tours for admin user_id=1');
      allTours = allTours.filter(tour => parseInt(tour.user_id) === 1);
    }
    
    // Log chi tiết để debug
    const pending = allTours.filter(t => t.status === 'pending').length;
    const approved = allTours.filter(t => t.status === 'approved').length;
    const rejected = allTours.filter(t => t.status === 'rejected').length;
    
    console.log(`API trả về ${allTours.length} tour cho admin ${req.user.id}: pending=${pending}, approved=${approved}, rejected=${rejected}`);
    
    res.status(200).json({ 
      success: true, 
      tours: allTours
    });
  } catch (error) {
    console.error('Error in getAllToursForAdmin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching admin tours',
      error: error.message
    });
  }
};
exports.searchTours = async (req, res) => {
  try {
    const keyword = req.query.query?.trim();

    if (!keyword) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm." });
    }

    // Gọi hàm tìm kiếm cơ bản
    const tours = await Tour.searchTours(keyword); // Lưu ý: hàm trong Model là searchTour

    res.status(200).json({
      success: true,
      count: tours.length,
      tours: tours,
    });
  } catch (err) {
    console.error("❌ Lỗi khi tìm kiếm tour:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi tìm kiếm tour." });
  }
};
// -------------------20/10/2025 update thêm lọc tour bán

/**
 * Lấy danh sách tours đã được duyệt để hiển thị cho khách hàng
 */
exports.getApprovedToursForSale = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 12, 
            destination, 
            price_min, 
            price_max, 
            duration, 
            sort_by = 'latest' 
        } = req.query;
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            destination,
            price_min: price_min ? parseFloat(price_min) : null,
            price_max: price_max ? parseFloat(price_max) : null,
            duration,
            sort_by
        };

        const result = await Tour.getApprovedToursForSale(options);
        
        res.json({
            success: true,
            data: {
                tours: result.tours,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    totalPages: Math.ceil(result.total / limit),
                    hasNext: page * limit < result.total,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('[Tour][getApprovedToursForSale] Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy danh sách tours',
            error: error.message 
        });
    }
};

/**
 * Lấy chi tiết tour để hiển thị cho khách hàng
 */
exports.getTourDetailForSale = async (req, res) => {
    try {
        const { tourId } = req.params;
        
        const tour = await Tour.getTourDetailForSale(tourId);
        
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tour hoặc tour chưa được duyệt'
            });
        }

        res.json({
            success: true,
            data: tour
        });
    } catch (error) {
        console.error('[Tour][getTourDetailForSale] Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy chi tiết tour',
            error: error.message 
        });
    }
};

/**
 * Lấy tours nổi bật
 */
exports.getFeaturedTours = async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        
        const tours = await Tour.getFeaturedTours(parseInt(limit));
        
        res.json({
            success: true,
            data: tours
        });
    } catch (error) {
        console.error('[Tour][getFeaturedTours] Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy tours nổi bật',
            error: error.message 
        });
    }
};

exports.approveTour = async (req, res) => {
  try {
    const { id } = req.params;

    const tour = await Tour.getTourById(id);
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tour' });
    }

    await Tour.updateTourStatus(id, 'approved');

    // GỬI THÔNG BÁO
    const io = req.app.get('io');
    await NotificationService.notifyTourApproved(io, tour.user_id, tour.id, tour.destination);

    res.json({ success: true, message: 'Đã duyệt tour thành công' });
  } catch (error) {
    console.error('[TourController] Error approving tour:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi duyệt tour' });
  }
};

const handleFileUpload = async (file, type, locationId) => {
  // --- CLOUDINARY UPLOAD ---
  const cloudResult = await uploadToCloudinary(file.data, 'locations');
  return cloudResult.url;
};

exports.rejectTour = async (req, res) => {
  try {
    const { id } = req.params;

    const tour = await Tour.getTourById(id);
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tour' });
    }

    await Tour.updateTourStatus(id, 'rejected');

    // GỬI THÔNG BÁO
    const io = req.app.get('io');
    await NotificationService.notifyTourRejected(io, tour.user_id, tour.id, tour.destination);

    res.json({ success: true, message: 'Đã từ chối tour' });
  } catch (error) {
    console.error('[TourController] Error rejecting tour:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};