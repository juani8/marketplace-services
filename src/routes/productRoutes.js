const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Rutas para productos específicos
router.get('/:productId', productController.getProductById);
router.patch('/:productId', productController.updateProduct);
router.delete('/:productId', productController.deleteProduct);

module.exports = router;
