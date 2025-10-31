const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tourPriceController');
const auth = require('../middlewares/autMiddleware');

// Kiểm tra
if (typeof auth.verifyToken !== 'function') throw new Error('auth.verifyToken not function');
if (typeof auth.isAdmin !== 'function') throw new Error('auth.isAdmin not function');
if (typeof ctrl.listByTour !== 'function') throw new Error('tourPriceController.listByTour not function');

router.get('/tour/:tourId', auth.verifyToken, ctrl.listByTour);
router.get('/:id', auth.verifyToken, ctrl.getOne);
router.post('/', auth.verifyToken, auth.isAdmin, ctrl.create);
router.put('/:id', auth.verifyToken, auth.isAdmin, ctrl.update);
router.delete('/:id', auth.verifyToken, auth.isAdmin, ctrl.remove);

module.exports = router;