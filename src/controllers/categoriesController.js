const CategoriaModel = require('../models/categoria.model');
const ProductoModel = require('../models/producto.model');

async function getAllCategories(req, res) {
  try {
    // Obtener solo las categorías que tienen productos del tenant del usuario
    const categorias = await CategoriaModel.getByTenant(req.user.tenant_id);
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

    // Verificar que la categoría tiene productos del tenant del usuario
    const tieneProductosDeTenant = await CategoriaModel.hasProductsFromTenant(categoriaId, req.user.tenant_id);
    if (!tieneProductosDeTenant) {
      return res.status(403).json({ message: 'No tienes acceso a esta categoría' });
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
    // Solo admins pueden crear categorías
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Solo administradores pueden crear categorías' 
      });
    }

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
    // Solo admins pueden eliminar categorías
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Solo administradores pueden eliminar categorías' 
      });
    }

    const { categoriaId } = req.params;

    const existe = await CategoriaModel.getById(categoriaId);
    if (!existe) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    // Verificar que la categoría no tiene productos de este tenant
    const tieneProductosDeTenant = await CategoriaModel.hasProductsFromTenant(categoriaId, req.user.tenant_id);
    if (tieneProductosDeTenant) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la categoría porque tiene productos asociados de tu tenant' 
      });
    }

    await CategoriaModel.delete(categoriaId);
    res.json({ message: `Categoría ${categoriaId} eliminada correctamente` });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    
    // Si el error es por constraint de foreign key (productos asociados de otros tenants)
    if (error.code === '23503') {
      return res.status(400).json({ 
        message: 'No se puede eliminar la categoría porque tiene productos asociados de otros tenants' 
      });
    }
    
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// PATCH /api/categories/:id
async function updateCategory(req, res) {
  try {
    // Solo admins pueden actualizar categorías
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Solo administradores pueden actualizar categorías' 
      });
    }

    const { categoriaId } = req.params;
    const { nombre, descripcion } = req.body;

    // Verificar que la categoría existe
    const categoriaExistente = await CategoriaModel.getById(categoriaId);
    if (!categoriaExistente) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    // Verificar que la categoría tiene productos del tenant del usuario
    const tieneProductosDeTenant = await CategoriaModel.hasProductsFromTenant(categoriaId, req.user.tenant_id);
    if (!tieneProductosDeTenant) {
      return res.status(403).json({ message: 'No puedes actualizar esta categoría porque no tienes productos asociados' });
    }

    // Validar que al menos un campo se está actualizando
    if (!nombre && descripcion === undefined) {
      return res.status(400).json({ 
        message: 'Debe proporcionar al menos un campo para actualizar (nombre o descripcion)' 
      });
    }

    // Actualizar la categoría
    const categoriaActualizada = await CategoriaModel.update(categoriaId, {
      nombre: nombre || categoriaExistente.nombre,
      descripcion: descripcion !== undefined ? descripcion : categoriaExistente.descripcion
    });

    res.json(categoriaActualizada);

  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
