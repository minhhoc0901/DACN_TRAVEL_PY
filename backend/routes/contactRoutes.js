const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const authMiddleware = require('../middlewares/autMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { validateContact } = require('../utils/validators/contactValidator');

// POST /api/contact/submit - Gửi tin nhắn liên hệ (validation)
router.post(
    '/submit', 
    validate(validateContact),
    contactController.submitContact
);

// GET /api/contact/messages - Admin lấy tất cả tin nhắn liên hệ
router.get(
    '/messages',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    contactController.getContactMessages
);

module.exports = router;