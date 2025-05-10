const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Rutas para productos específicos
router.get('/products/:productId', productController.getProductById);
router.post('/catalogs/:catalogId/products', productController.createProduct);
router.patch('/products/:productId', productController.updateProduct);
router.delete('/products/:productId', productController.deleteProduct);

module.exports = router;
