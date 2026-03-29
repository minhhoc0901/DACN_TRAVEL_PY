const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const auth = require('../middlewares/autMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { validateHotel } = require('../utils/validators/hotelValidator');

// ===== PUBLIC ROUTES =====
router.get('/', hotelController.getAllHotels);
router.get('/search/:keyword', hotelController.searchHotels);
router.get('/location/:locationId', hotelController.getHotelsByLocation);
router.get('/:id', hotelController.getHotelById);

// ===== ADMIN ROUTES =====
router.post(
    '/', 
    auth.verifyToken, 
    auth.isAdmin, 
    // validate((data) => validateHotel(data, false)),
    hotelController.createHotel
);

router.put(
    '/:id', 
    auth.verifyToken, 
    auth.isAdmin, 
    // validate((data) => validateHotel(data, true)),
    hotelController.updateHotel
);

router.delete('/:id', auth.verifyToken, auth.isAdmin, hotelController.deleteHotel);

module.exports = router;