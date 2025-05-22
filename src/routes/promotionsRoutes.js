const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionsController');

// Obtener todas las promociones del tenant
router.get('/', promotionController.getAllPromotions);

// Crear una nueva promoción
router.post('/', promotionController.createPromotion);

// Actualizar parcialmente una promoción existente
router.patch('/:promotionId', promotionController.updatePromotion);

// Eliminar una promoción
router.delete('/:promotionId', promotionController.deletePromotion);

module.exports = router;
