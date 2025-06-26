const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const uploadCSV = require('../config/csvMulterConfig');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

// Ruta para crear producto en un catálogo específico
// Esta ruta debe estar en catalogRoutes.js ya que empieza con /catalogs
// router.post('/catalogs/:catalogId/products', productController.createProduct.upload, productController.createProduct);

// ============ RUTAS DE CARGA MASIVA (SOLO ADMINS) ============

// GET /products/csv/template - Obtener template CSV (requiere autenticación)
router.get('/csv/template', authenticateToken, productController.getCSVTemplate);

// POST /products/csv/upload - Subir CSV con productos (solo admins)
router.post('/csv/upload', 
  authenticateToken,
  requireAdmin,
  uploadCSV.single('file'),
  productController.uploadProductsCSV
);

// ============ RUTAS REGULARES DE PRODUCTOS ============

// Rutas para productos específicos (todas requieren autenticación)
router.get('/:productId', authenticateToken, productController.getProductById);
router.patch('/:productId', authenticateToken, productController.updateProduct.upload, productController.updateProduct);
router.delete('/:productId', authenticateToken, productController.deleteProduct);
router.get('/', authenticateToken, productController.getProducts);
router.post('/', authenticateToken, productController.createProduct.upload, productController.createProduct);

module.exports = router;
