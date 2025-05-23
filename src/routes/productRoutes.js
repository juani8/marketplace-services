const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Ruta para crear producto en un catálogo específico
// Esta ruta debe estar en catalogRoutes.js ya que empieza con /catalogs
// router.post('/catalogs/:catalogId/products', productController.createProduct.upload, productController.createProduct);

// Rutas para productos específicos
router.get('/:productId', productController.getProductById);
router.patch('/:productId', productController.updateProduct.upload, productController.updateProduct);
router.delete('/:productId', productController.deleteProduct);
router.get('/', productController.getProducts);
router.post('/', productController.createProduct.upload, productController.createProduct);

module.exports = router;
