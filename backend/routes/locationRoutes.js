
const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/LocationController');
const authMiddleware = require('../middlewares/autMiddleware');
// 1. Import các middleware cache
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const invalidateCacheMiddleware = require('../middlewares/invalidateCacheMiddleware');


// 2. Định nghĩa một tiền tố duy nhất cho cache của location
const LOCATION_CACHE_PREFIX = '/api/locations';

// === PUBLIC ROUTES (ÁP DỤNG CACHE) ===
// Gắn cacheMiddleware vào tất cả các route GET để tự động cache
router.get('/', cacheMiddleware, LocationController.getAllLocations);
router.get('/search', cacheMiddleware, LocationController.searchLocations);
router.get('/name/:name', cacheMiddleware, LocationController.getLocationByName);
router.get('/:id', cacheMiddleware, LocationController.getLocationById);

// === ADMIN ROUTES (ÁP DỤNG XÓA CACHE TỰ ĐỘNG) ===
// Khi tạo mới, xóa cache của toàn bộ danh sách
router.post(
    '/', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    invalidateCacheMiddleware(LOCATION_CACHE_PREFIX), 
    LocationController.createLocation
);

// Khi cập nhật, xóa cache của danh sách VÀ của chính item đó
router.put(
    '/:id', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    invalidateCacheMiddleware([
        LOCATION_CACHE_PREFIX, 
        (req) => `${LOCATION_CACHE_PREFIX}/${req.params.id}`
    ]), 
    LocationController.updateLocation
);

// Khi xóa, logic tương tự như cập nhật
router.delete(
    '/:id', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    invalidateCacheMiddleware([
        LOCATION_CACHE_PREFIX, 
        (req) => `${LOCATION_CACHE_PREFIX}/${req.params.id}`
    ]), 
    LocationController.deleteLocation
);

// === CÁC ROUTE THAY ĐỔI DỮ LIỆU KHÁC ===
// Các hành động này cũng làm thay đổi dữ liệu của một location cụ thể,
// vì vậy chúng ta cũng cần xóa cache của item đó.
router.post(
    '/:id/images', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    invalidateCacheMiddleware((req) => `${LOCATION_CACHE_PREFIX}/${req.params.id}`), 
    LocationController.uploadImage
);

router.delete(
    '/:id/images/:imageId', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    invalidateCacheMiddleware((req) => `${LOCATION_CACHE_PREFIX}/${req.params.id}`), 
    LocationController.deleteImage
);

router.post(
    '/:id/nearby', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    invalidateCacheMiddleware((req) => `${LOCATION_CACHE_PREFIX}/${req.params.id}`), 
    LocationController.addNearbyLocation
);

router.delete(
    '/:id/nearby/:nearbyId', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    invalidateCacheMiddleware((req) => `${LOCATION_CACHE_PREFIX}/${req.params.id}`), 
    LocationController.removeNearbyLocation
);

module.exports = router;