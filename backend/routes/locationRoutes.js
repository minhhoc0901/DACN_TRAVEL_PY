const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/LocationController');
const authMiddleware = require('../middlewares/autMiddleware');

// Public routes
router.get('/', LocationController.getAllLocations);
router.get('/search', LocationController.searchLocations);
router.get('/name/:name', LocationController.getLocationByName);
router.get('/:id', LocationController.getLocationById);

// Protected routes (cần đăng nhập và quyền admin)
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, LocationController.createLocation);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, LocationController.updateLocation);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, LocationController.deleteLocation);

// Image routes
router.post('/:id/images', authMiddleware.verifyToken, authMiddleware.isAdmin, LocationController.uploadImage);
router.delete('/:id/images/:imageId', authMiddleware.verifyToken, authMiddleware.isAdmin, LocationController.deleteImage);

// Nearby location routes
router.post('/:id/nearby', authMiddleware.verifyToken, authMiddleware.isAdmin, LocationController.addNearbyLocation);
router.delete('/:id/nearby/:nearbyId', authMiddleware.verifyToken, authMiddleware.isAdmin, LocationController.removeNearbyLocation);

module.exports = router;