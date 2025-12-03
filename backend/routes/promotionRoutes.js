const express = require('express');
const router = express.Router();
const promo = require('../controllers/promotionController'); 
const auth = require('../middlewares/autMiddleware'); 
const { validate } = require('../middlewares/validationMiddleware');
const { validatePromotion, validatePromotionCode } = require('../utils/validators/promotionValidator');

// Kiểm tra
if (typeof auth.verifyToken !== 'function') throw new Error('auth.verifyToken not function');
if (typeof auth.isAdmin !== 'function') throw new Error('auth.isAdmin not function');
if (typeof promo.listActive !== 'function') throw new Error('promotionController.listActive not function');

// Active (có thể cho public: bỏ verifyToken nếu muốn)
router.get('/active', auth.verifyToken, promo.listActive);
router.post('/validate', auth.verifyToken, validate(validatePromotionCode), promo.validatePromotion);
// Admin CRUD
router.get('/', auth.verifyToken, auth.isAdmin, promo.listAll);
router.get('/:id', auth.verifyToken, auth.isAdmin, promo.getOne);
router.post('/', auth.verifyToken, auth.isAdmin, validate((data) => validatePromotion(data, false)), promo.create);
router.put('/:id', auth.verifyToken, auth.isAdmin, validate((data) => validatePromotion(data, true)), promo.update);
router.delete('/:id', auth.verifyToken, auth.isAdmin, promo.remove);

module.exports = router;