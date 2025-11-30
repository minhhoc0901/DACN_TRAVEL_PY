const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const authMiddleware = require('../middlewares/autMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const invalidateCacheMiddleware = require('../middlewares/invalidateCacheMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { validateTour } = require('../utils/validators/tourValidator');


// 2. Định nghĩa tiền tố cache cho tour
const TOUR_CACHE_PREFIX = '/api/tours';

// === PUBLIC ROUTES (CACHE ENABLED) ===
// Các API này được gọi thường xuyên bởi khách truy cập, cần được cache để tăng tốc.
router.get('/for-sale', cacheMiddleware, tourController.getApprovedToursForSale);
router.get('/featured', cacheMiddleware, tourController.getFeaturedTours);
router.get("/search", cacheMiddleware, tourController.searchTours);
router.get('/location/:id', cacheMiddleware, tourController.getToursByLocation);
router.get('/images', cacheMiddleware, tourController.getTourImages); // Có thể cache
router.get('/detail/:tourId', cacheMiddleware, tourController.getTourDetailForSale);
// Route GET / phải đặt sau các route GET cụ thể khác
router.get('/', cacheMiddleware, tourController.getAllTours);


// === USER & ADMIN SPECIFIC ROUTES (NO CACHE) ===
// Các API này trả về dữ liệu riêng tư, không được cache toàn cục.
router.get('/user/tours', authMiddleware.verifyToken, tourController.getUserTours);
router.get('/admin/tours', authMiddleware.verifyToken, authMiddleware.isAdmin, tourController.getAdminTours);
router.get('/admin/all', authMiddleware.verifyToken, authMiddleware.isAdmin, tourController.getAllToursForAdmin);
router.get('/debug/tours-status', authMiddleware.verifyToken, async (req, res) => { /* ... logic ... */ });


// === DATA MODIFYING ROUTES (CACHE INVALIDATION) ===
// Bất kỳ hành động nào trong nhóm này đều sẽ xóa tất cả cache có tiền tố '/api/tours'.
const invalidateAllTourCache = invalidateCacheMiddleware(TOUR_CACHE_PREFIX);

router.post('/',
    authMiddleware.verifyToken, 
    invalidateAllTourCache,
    validate((data) => validateTour(data, false)), 
    tourController.createTour);
router.post('/upload-image', invalidateAllTourCache, tourController.uploadTourImage); // Giả sử upload ảnh liên quan đến tour
router.put('/admin/tours/:id/status', authMiddleware.verifyToken, authMiddleware.isAdmin, invalidateAllTourCache, tourController.updateTourStatus);

// 
router.put('/admin/tours/:id/approve', authMiddleware.verifyToken, authMiddleware.isAdmin, invalidateAllTourCache, tourController.approveTour);
router.put('/admin/tours/:id/reject', authMiddleware.verifyToken, authMiddleware.isAdmin, invalidateAllTourCache, tourController.rejectTour);
//  ĐỂ ẨN TOUR
router.put('/admin/tours/:id/hide', authMiddleware.verifyToken, authMiddleware.isAdmin, invalidateAllTourCache, tourController.hideTour);
router.put('/admin/tours/:id/restore', authMiddleware.verifyToken, authMiddleware.isAdmin, invalidateAllTourCache, tourController.restoreTour);

// Khi cập nhật hoặc xóa một tour cụ thể, chúng ta cũng xóa toàn bộ cache cho chắc chắn.
router.put('/:id', 
    authMiddleware.verifyToken, 
    invalidateAllTourCache,
    validate((data) => validateTour(data, true)),
    tourController.updateTour);
router.delete('/:id', authMiddleware.verifyToken, invalidateAllTourCache, tourController.deleteTour);


// === ĐẶT CUỐI CÙNG: GET A TOUR BY ID (CACHE ENABLED) ===
// Route này phải đặt cuối cùng để không bị nhầm với các route như /search, /featured...
router.get('/:id', cacheMiddleware, tourController.getTourById);


module.exports = router;