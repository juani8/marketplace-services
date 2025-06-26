const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// GET /api/orders/:comercio_id - Obtiene todas las órdenes de un comercio (requiere autenticación)
router.get('/:comercio_id', authenticateToken, orderController.getOrdersByComercio);

module.exports = router; 