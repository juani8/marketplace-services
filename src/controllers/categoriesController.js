const CategoriaModel = require('../models/categoria.model');

async function getAllCategories(req, res) {
  try {
    const categorias = await CategoriaModel.getAll();
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// GET /api/categories/:id
async function getCategoryById(req, res) {
  try {
    const { categoriaId } = req.params;
    const categoria = await CategoriaModel.getById(categoriaId);

    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    res.json(categoria);
  } catch (error) {
    console.error('Error al obtener categoría por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// POST /api/categories
async function createCategory(req, res) {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }

    const nuevaCategoria = await CategoriaModel.create({ nombre, descripcion });
    res.status(201).json(nuevaCategoria);
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// DELETE /api/categories/:id
async function deleteCategory(req, res) {
  try {
    const { categoriaId } = req.params;

    const existe = await CategoriaModel.getById(categoriaId);
    if (!existe) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    await CategoriaModel.delete(categoriaId);
    res.json({ message: `Categoría ${categoriaId} eliminada correctamente` });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  deleteCategory
};
