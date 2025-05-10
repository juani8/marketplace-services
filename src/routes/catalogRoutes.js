const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');

// Obtener todos los catálogos de un seller
router.get('/sellers/:sellerId/catalogs', catalogController.getSellerCatalogs);

// Rutas para catálogos específicos (no necesitan sellerId en la URL)
router.get('/catalogs/:catalogId', catalogController.getCatalogById);
router.post('/sellers/:sellerId/catalogs', catalogController.createCatalog);
router.delete('/catalogs/:catalogId', catalogController.deleteCatalog);

// Obtener todos los productos de un catálogo
router.get('/catalogs/:catalogId/products', catalogController.getCatalogProducts);

module.exports = router;
