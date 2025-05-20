const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');

// Endpoint: GET /api/categories
router.get('/', categoriesController.getAllCategories);

// GET /api/categories/:categoriaId
router.get('/:categoriaId', categoriesController.getCategoryById);

// POST /api/categories
router.post('/', categoriesController.createCategory);


// PATCH /api/categories/:categoriaId
//router.patch('/:categoriesId', categoriesController.patchCategory);


// DELETE /api/categories/:categoriaId
router.delete('/:categoriaId', categoriesController.deleteCategory);

module.exports = router;


