const express = require('express');
const router = express.Router();
const { 
  getSellersNearby,
  getComercios,
  getComercioById,
  createComercio,
  patchComercio,
  deleteComercio
} = require('../controllers/sellerController');

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

// GET /sellers - Dual functionality: nearby search OR tenant listing
router.get('/', handleGetSellers);

// GET /sellers/:id - Obtener un comercio específico
router.get('/:id', getComercioById);

// POST /sellers - Crear nuevo comercio
router.post('/', createComercio);

// PATCH /sellers/:id - Actualización parcial de comercio
router.patch('/:id', patchComercio);

// DELETE /sellers/:id - Eliminar comercio
router.delete('/:id', deleteComercio);

module.exports = router;
