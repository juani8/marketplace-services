const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const uploadCSV = require('../config/csvMulterConfig');
const { requireAdmin } = require('../middlewares/authMiddleware');

// Ruta para crear producto en un catálogo específico
// Esta ruta debe estar en catalogRoutes.js ya que empieza con /catalogs
// router.post('/catalogs/:catalogId/products', productController.createProduct.upload, productController.createProduct);

// ============ RUTAS DE CARGA MASIVA (SOLO ADMINS) ============

// GET /products/csv/template - Obtener template CSV (info pública)
router.get('/csv/template', productController.getCSVTemplate);

// POST /products/csv/upload - Subir CSV con productos (solo admins)
router.post('/csv/upload', 
  requireAdmin,
  uploadCSV.single('file'),
  productController.uploadProductsCSV
);

// ============ RUTAS REGULARES DE PRODUCTOS ============

// Rutas para productos específicos
router.get('/:productId', productController.getProductById);
router.patch('/:productId', productController.updateProduct.upload, productController.updateProduct);
router.delete('/:productId', productController.deleteProduct);
router.get('/', productController.getProducts);
router.post('/', productController.createProduct.upload, productController.createProduct);

module.exports = router;
