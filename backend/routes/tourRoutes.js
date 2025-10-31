const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const authMiddleware = require('../middlewares/autMiddleware'); // Sửa từ authMiddleware thành autMiddleware
const { isAdmin } = require('../middlewares/autMiddleware'); // Import isAdmin từ autMiddleware

// Đặt tất cả các route cụ thể trước route có tham số
// Lấy danh sách tours đã được duyệt để bán 20/10/2025
// Public routes for customers
router.get('/for-sale', tourController.getApprovedToursForSale);
router.get('/featured', tourController.getFeaturedTours);
// Tìm kiếm tour
router.get("/search", tourController.searchTours);
// Lấy danh sách ảnh tour
router.get('/images', tourController.getTourImages);

// Upload ảnh tour
router.post('/upload-image', tourController.uploadTourImage);

// Get tours by location
router.get('/location/:id', tourController.getToursByLocation);

// THÊM: Debug route để xem trạng thái tours - đặt TRƯỚC route /:id
router.get('/debug/tours-status', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { pool } = require('../config/db');
    const [rows] = await pool.execute(`
      SELECT id, destination, status, created_at, user_id
      FROM Tours
      ORDER BY created_at DESC
    `);
    
    const counts = {
      total: rows.length,
      pending: rows.filter(r => r.status === 'pending').length,
      approved: rows.filter(r => r.status === 'approved').length,
      rejected: rows.filter(r => r.status === 'rejected').length,
      null: rows.filter(r => r.status === null).length,
    };
    
    res.status(200).json({
      success: true,
      counts,
      tours: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during debug',
      error: error.message
    });
  }
});

// Routes cho phê duyệt tour
router.get('/admin/tours', authMiddleware.verifyToken, authMiddleware.isAdmin, tourController.getAdminTours);
router.get('/tours/admin/tours', authMiddleware.verifyToken, authMiddleware.isAdmin, tourController.getAdminTours);
router.put('/admin/tours/:id/status', authMiddleware.verifyToken, authMiddleware.isAdmin, tourController.updateTourStatus);
router.get('/user/tours', authMiddleware.verifyToken, tourController.getUserTours);

// Create a new tour
router.post('/', authMiddleware.verifyToken, tourController.createTour);
// router.post('/', authMiddleware.verifyToken,authMiddleware.isAdmin, tourController.createTour);
// Get all tours (chỉ lấy tour đã duyệt)
router.get('/', tourController.getAllTours);

// ĐẶT CUỐI CÙNG: Get a tour by ID (phải đặt sau tất cả các route cụ thể khác)
router.get('/:id', tourController.getTourById);

// Update a tour
router.put('/:id', tourController.updateTour);

// Delete a tour
router.delete('/:id', tourController.deleteTour);

// Add this route with your other admin routes
router.get('/admin/all', authMiddleware.verifyToken, authMiddleware.isAdmin, tourController.getAllToursForAdmin);


router.get('/detail/:tourId', tourController.getTourDetailForSale);


module.exports = router;