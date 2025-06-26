const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Endpoint: GET /api/categories (requiere autenticación)
router.get('/', authenticateToken, categoriesController.getAllCategories);

// GET /api/categories/:categoriaId (requiere autenticación)
router.get('/:categoriaId', authenticateToken, categoriesController.getCategoryById);

// POST /api/categories (requiere autenticación)
router.post('/', authenticateToken, categoriesController.createCategory);

// PATCH /api/categories/:categoriaId (requiere autenticación)
router.patch('/:categoriaId', authenticateToken, categoriesController.updateCategory);

// DELETE /api/categories/:categoriaId (requiere autenticación)
router.delete('/:categoriaId', authenticateToken, categoriesController.deleteCategory);

module.exports = router;


