const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// GET /api/orders/:comercio_id - Obtiene todas las órdenes de un comercio
router.get('/:comercio_id', orderController.getOrdersByComercio);

module.exports = router; 