const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');

// Cambiamos la ruta de nearby a la ruta principal de sellers
router.get('/', sellerController.getSellersNearby);

// Endpoints para gestionar catálogos
router.get('/:sellerId/catalog', sellerController.getSellerCatalogs);
router.get('/:sellerId/catalog/:catalogId', sellerController.getCatalogById);
router.post('/:sellerId/catalog', sellerController.createCatalog);
router.delete('/:sellerId/catalog/:catalogId', sellerController.deleteCatalog);

// Añadir estas rutas para gestión de productos
router.get('/:sellerId/catalog/:catalogId/products', sellerController.getProducts);
router.get('/:sellerId/catalog/:catalogId/products/:productId', sellerController.getProductById);
router.post('/:sellerId/catalog/:catalogId/products', sellerController.createProduct);
router.patch('/:sellerId/catalog/:catalogId/products/:productId', sellerController.updateProduct);
router.delete('/:sellerId/catalog/:catalogId/products/:productId', sellerController.deleteProduct);

module.exports = router;
