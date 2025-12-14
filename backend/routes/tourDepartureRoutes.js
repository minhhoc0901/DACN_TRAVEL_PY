const express = require('express');
const router = express.Router();
const departureController = require('../controllers/tourDepartureController');
const auth = require('../middlewares/autMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { validateTourDeparture } = require('../utils/validators/tourDepartureValidator');

// ===== PUBLIC ROUTES =====
router.get('/:tourId/available', departureController.getAvailableDepartures);

// ===== ADMIN ROUTES =====
router.get('/:tourId', auth.verifyToken, auth.isAdmin, departureController.getAllDeparturesForTour);

router.post(
    '/', 
    auth.verifyToken, 
    auth.isAdmin, 
    // validate((data) => validateTourDeparture(data, false)),
    departureController.createDeparture
);

router.put(
    '/:id',
    auth.verifyToken,
    auth.isAdmin,
    // validate((data) => validateTourDeparture(data, true)),
    departureController.updateDeparture
);

router.delete('/:id', auth.verifyToken, auth.isAdmin, departureController.deleteDeparture);

module.exports = router;