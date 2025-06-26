const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionsController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Obtener todas las promociones del tenant (requiere autenticación)
router.get('/', authenticateToken, promotionController.getAllPromotions);

// Crear una nueva promoción (requiere autenticación)
router.post('/', authenticateToken, promotionController.createPromotion);

// Actualizar parcialmente una promoción existente (requiere autenticación)
router.patch('/:promotionId', authenticateToken, promotionController.updatePromotion);

// Eliminar una promoción (requiere autenticación)
router.delete('/:promotionId', authenticateToken, promotionController.deletePromotion);

module.exports = router;
