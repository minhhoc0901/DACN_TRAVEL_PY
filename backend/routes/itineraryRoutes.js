const express = require('express');
const router = express.Router();
const itineraryController = require('../controllers/itineraryController');
const authMiddleware = require('../middlewares/autMiddleware');

// Định nghĩa route POST /api/itineraries/suggest

router.post('/suggest',authMiddleware.verifyToken,itineraryController.suggestItinerary );

module.exports = router;