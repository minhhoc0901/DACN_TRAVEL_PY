const fs = require('fs');
const path = require('path');
const Tour = require('../models/Tour');

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
  
} = require('../models/Tour');

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
    // Xử lý file ảnh nếu có
    if (req.files && req.files.image) {
      const file = req.files.image;
      const fileName = `${Date.now()}-${file.name}`;
      const uploadPath = path.join(__dirname, '../uploads/tours', fileName);
      
      await file.mv(uploadPath);
      tourData.image = `/uploads/tours/${fileName}`;
    } else {
      // Nếu không có ảnh, sử dụng ảnh mặc định
      tourData.image = '/uploads/tours/default-tour.jpg';
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
    const tours = await getAllTours(false); // false để chỉ lấy tour đã phê duyệt
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
    // Kiểm tra quyền admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập - Yêu cầu quyền Admin'
      });
    }
    
    console.log('Admin user requesting all tours:', req.user.id);
    
    // QUAN TRỌNG: Cần truyền true vào hàm getAllTours để bao gồm các tour ở tất cả trạng thái
    const allTours = await getAllTours(true);
    
    // Log chi tiết để debug
    const pending = allTours.filter(t => t.status === 'pending').length;
    const approved = allTours.filter(t => t.status === 'approved').length;
    const rejected = allTours.filter(t => t.status === 'rejected').length;
    
    console.log(`API trả về ${allTours.length} tour: pending=${pending}, approved=${approved}, rejected=${rejected}`);
    
    res.status(200).json({ 
      success: true, 
      tours: allTours
    });
  } catch (error) {
    console.error('Error in getAdminTours:', error);
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
    const userTours = await getToursByUser(req.user.id);

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

    // Kiểm tra xem dữ liệu đã là object hay chưa
    // Nếu là string, thử parse JSON
    if (typeof tourData.highlights === 'string') {
      try {
        tourData.highlights = JSON.parse(tourData.highlights);
      } catch (e) {
        // Nếu không parse được, giữ nguyên giá trị
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

    // Validate required fields
    if (!tourData.destination || !tourData.departure_from || 
        !tourData.duration || !tourData.description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate schedule
    if (!Array.isArray(tourData.schedule) || tourData.schedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule format'
      });
    }

    // Reset status to 'pending' if the tour is being updated
    // This ensures tour must be re-reviewed by admin
    // Skip if admin is the one making changes
    if (!req.isAdmin) {
      tourData.status = 'pending';
    }

    // Handle file upload if exists
    if (req.files && req.files.image) {
      const file = req.files.image;
      const fileName = `${Date.now()}-${file.name}`;
      const uploadPath = path.join(__dirname, '../uploads/tours', fileName);
      
      await file.mv(uploadPath);
      tourData.image = `/uploads/tours/${fileName}`;
    }

    const success = await updateTour(tourId, tourData);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tour updated successfully'
    });
  } catch (error) {
    console.error('Update tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tour',
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
    const uploadsDir = path.join(__dirname, '../uploads/tours'); // Đường dẫn tới thư mục uploads/tours
    
    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Đọc tất cả file trong thư mục
    const files = fs.readdirSync(uploadsDir);
    
    // Lọc chỉ lấy các file hình ảnh
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    // Tạo đường dẫn đầy đủ cho mỗi file
    const images = imageFiles.map(file => {
      try {
        const stats = fs.statSync(path.join(uploadsDir, file));
        return {
          name: file,
          url: `/uploads/tours/${file}`, // Đường dẫn URL tới file
          size: stats.size, // kích thước tính bằng byte
          createdAt: stats.birthtime, // ngày tạo file
        };
      } catch (err) {
        return {
          name: file,
          url: `/uploads/tours/${file}`,
          error: 'Không thể đọc thông tin file'
        };
      }
    });
    
    res.status(200).json({
      success: true,
      images: images
    });
  } catch (error) {
    console.error('Error fetching tour images:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách ảnh',
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
    
    // Tạo thư mục nếu chưa tồn tại
    const uploadDir = path.join(__dirname, '../uploads/tours');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Tạo tên file duy nhất để tránh trùng lặp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `tour-${uniqueSuffix}.${fileExt}`;
    const uploadPath = path.join(uploadDir, fileName);
    
    // Upload file
    await tourImage.mv(uploadPath);
    
    // Trả về thông tin file đã upload
    res.status(200).json({
      success: true,
      message: 'Upload thành công',
      imageUrl: `/uploads/tours/${fileName}`,
      fileName: fileName,
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
    let allTours = await getAllTours(true); // true để lấy tất cả các trạng thái
    
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
// ✅ APPROVE TOUR - TẠO NOTIFICATION VỚI ACTION_URL
exports.approveTour = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Lấy thông tin tour
    const tour = await Tour.getTourById(id);
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tour' });
    }

    // 2. Cập nhật trạng thái tour
    await Tour.updateTourStatus(id, 'approved');
    console.log(`[TourController] ✅ Tour ${id} approved for user ${tour.user_id}`);

    // 3. Tạo thông báo
    const notificationMessage = `Tour "${tour.destination}" của bạn đã được duyệt và hiển thị công khai!`;
    const actionUrl = `/itinerary/${tour.id}`;
    const notification = await Notification.createNotificationWithType(
      tour.user_id,
      notificationMessage,
      NOTIFICATION_TYPES.TOUR_APPROVED,
      parseInt(tour.id),
      actionUrl
    );

    console.log('[TourController] Notification created:', notification);

    // 4. Emit notification qua Socket.IO
    const io = req.app.get('io');
    if (io) {
      const userRoom = `user_${tour.user_id}`;
      io.to(userRoom).emit('new_notification', {
        id: notification.id,
        message: notification.message,
        type: notification.type,
        action_url: notification.action_url,
        created_at: notification.created_at,
      });
      console.log(`[TourController] ✅ Notification emitted to ${userRoom}`);
    } else {
      console.warn('[TourController] ❌ Socket.IO instance not found');
    }

    res.json({ success: true, message: 'Đã duyệt tour thành công' });
  } catch (error) {
    console.error('[TourController] ❌ Error approving tour:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi duyệt tour', error: error.message });
  }
};

// ✅ REJECT TOUR - TẠO NOTIFICATION VỚI ACTION_URL
exports.rejectTour = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Lấy thông tin tour
    const tour = await Tour.getTourById(id);
    if (!tour) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy tour' 
      });
    }

    if (!tour.user_id) {
      console.error('[TourController] Tour không có user_id:', tour);
      return res.status(400).json({
        success: false,
        message: 'Tour không có thông tin người tạo'
      });
    }

    // 2. Cập nhật status
    await Tour.updateTourStatus(id, 'rejected');
    console.log(`[TourController] ❌ Tour ${id} rejected for user ${tour.user_id}`);
    
    // 3. Tạo notification với action_url
    const notificationMessage = `Tour "${tour.destination}" của bạn đã bị từ chối. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.`;
    const actionUrl = `/admin/tours`; // Chuyển hướng đến trang quản trị tour
    
    const notification = await Notification.createNotificationWithType(
      tour.user_id,
      notificationMessage,
      NOTIFICATION_TYPES.TOUR_REJECTED,
      parseInt(tour.id),
      actionUrl
    );
    
    console.log('[TourController] Notification created:', notification);

    // 4. Emit notification qua socket
    const io = req.app.get('io');
    if (io) {
      const notificationData = {
        id: notification.id,
        user_id: tour.user_id,
        message: notification.message,
        type: notification.type,
        related_id: notification.related_id,
        action_url: `/itinerary/${tour.id}`,
        created_at: notification.created_at || new Date(),
      };

      const userRoom = `user_${tour.user_id}`; // Room của user
      io.to(userRoom).emit('new_notification', notificationData); // Emit sự kiện
      console.log(`[TourController] ✅ Notification emitted to ${userRoom}:`, notificationData);
    } else {
      console.warn('[TourController] ❌ Socket.IO instance not found');
    }

    res.json({ 
      success: true, 
      message: 'Đã từ chối tour thành công' 
    });
  } catch (error) {
    console.error('[TourController] ❌ Error rejecting tour:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi từ chối tour',
      error: error.message
    });
  }
};