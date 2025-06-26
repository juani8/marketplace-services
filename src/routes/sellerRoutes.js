const express = require('express');
const router = express.Router();
const { 
  getSellersNearby,
  getComercios,
  getComercioById,
  createComercio,
  patchComercio,
  deleteComercio,
  getComercioProducts,
  getProductStock,
  updateProductStock
} = require('../controllers/sellerController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Middleware para determinar qué función usar en GET /sellers
function handleGetSellers(req, res, next) {
  const { lat, lon } = req.query;
  
  // Si tiene parámetros lat/lon, buscar sellers cercanos
  if (lat && lon) {
    return getSellersNearby(req, res, next);
  }
  
  // Si no, obtener comercios del tenant
  return getComercios(req, res, next);
}

// ============ RUTAS DE SELLERS (COMERCIOS) ============

// GET /sellers - Dual functionality: nearby search OR tenant listing (requiere autenticación)
router.get('/', authenticateToken, handleGetSellers);

// GET /sellers/:id - Obtener un comercio específico (requiere autenticación)
router.get('/:id', authenticateToken, getComercioById);

// POST /sellers - Crear nuevo comercio (requiere autenticación)
router.post('/', authenticateToken, createComercio);

// PATCH /sellers/:id - Actualización parcial de comercio (requiere autenticación)
router.patch('/:id', authenticateToken, patchComercio);

// DELETE /sellers/:id - Eliminar comercio (requiere autenticación)
router.delete('/:id', authenticateToken, deleteComercio);

// ============ RUTAS DE PRODUCTOS Y STOCK ============

// GET /sellers/:id/products - Obtener productos del comercio con stock (requiere autenticación)
router.get('/:id/products', authenticateToken, getComercioProducts);

// GET /sellers/:id/products/:productId/stock - Obtener stock específico de un producto (requiere autenticación)
router.get('/:id/products/:productId/stock', authenticateToken, getProductStock);

// PATCH /sellers/:id/products/:productId/stock - Actualizar stock de un producto (requiere autenticación)
router.patch('/:id/products/:productId/stock', authenticateToken, updateProductStock);

module.exports = router;
