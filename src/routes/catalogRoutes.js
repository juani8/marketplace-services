const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');
const productController = require('../controllers/productController');

// Obtener todos los catálogos de un seller
//router.get('/sellers/:sellerId/catalogs', catalogController.getSellerCatalogs);
//
//// Rutas para catálogos específicos (no necesitan sellerId en la URL)
//router.get('/catalogs/:catalogId', catalogController.getCatalogById);
//router.post('/sellers/:sellerId/catalogs', catalogController.createCatalog);
//router.delete('/catalogs/:catalogId', catalogController.deleteCatalog);
//
//// Obtener todos los productos de un catálogo
//router.get('/catalogs/:catalogId/products', catalogController.getCatalogProducts);

// GET /api/catalogs
router.get('/', catalogController.getAllCatalogs);

// GET /api/catalogs/:catalogId
router.get('/:catalogId', catalogController.getCatalogById);

// POST /api/tenants
router.post('/', catalogController.createCatalog);


// PATCH /api/tenants/:id
//router.patch('/:tenantId', catalogController.patchCatalog);


// DELETE /api/tenants/:tenantId
router.delete('/:catalogId', catalogController.deleteCatalog);

router.post('/:catalogId/products', productController.createProduct.upload, productController.createProduct);

module.exports = router;