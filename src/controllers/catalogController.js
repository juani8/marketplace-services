const TenantModel = require('../models/tenant.model');
const CatalogoModel = require('../models/catalogo.model');
const ProductoModel = require('../models/producto.model');
const { formatearProductos } = require('../utils/formatters');

// Obtener todos los catálogos de un seller
async function getSellerCatalogs(req, res) {
  try {
    const { sellerId } = req.params;
    
    // Validamos que el seller exista
    const seller = await TenantModel.getById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller no encontrado' });
    }
    
    // Obtenemos los catálogos del seller
    const catalogs = await CatalogoModel.getByTenantId(sellerId);
    
    // Para cada catálogo, obtenemos sus productos
    const catalogsWithProducts = [];
    
    for (const catalog of catalogs) {
      const productos = await ProductoModel.getByCatalogoId(catalog.catalogo_id);
      const productosFormateados = await formatearProductos(productos);
      
      catalogsWithProducts.push({
        catalogo_id: catalog.catalogo_id.toString(),
        tenant_id: catalog.tenant_id.toString(),
        productos: productosFormateados,
        fecha_actualizacion: catalog.fecha_actualizacion
      });
    }
    
    res.json(catalogsWithProducts);
    
  } catch (error) {
    console.error('Error obteniendo catálogos del seller:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Obtener un catálogo específico por ID
async function getCatalogById(req, res) {
  try {
    const { catalogId } = req.params;
    
    // Obtenemos el catálogo
    const catalog = await CatalogoModel.getById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catálogo no encontrado' });
    }
    
    // Obtenemos los productos del catálogo
    const productos = await ProductoModel.getByCatalogoId(catalogId);
    
    // Formatear los productos con sus imágenes y promociones
    const productosFormateados = await formatearProductos(productos);
    
    // Construimos la respuesta
    const catalogWithProducts = {
      catalogo_id: catalog.catalogo_id.toString(),
      tenant_id: catalog.tenant_id.toString(),
      productos: productosFormateados,
      fecha_actualizacion: catalog.fecha_actualizacion
    };
    
    res.json(catalogWithProducts);
    
  } catch (error) {
    console.error('Error obteniendo catálogo por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Crear un nuevo catálogo para un seller
async function createCatalog(req, res) {
  try {
    const { sellerId } = req.params;
    
    // Validamos que el seller exista
    const seller = await TenantModel.getById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller no encontrado' });
    }
    
    // Creamos el catálogo
    const newCatalog = await CatalogoModel.create({ tenant_id: parseInt(sellerId) });
    
    res.status(201).json({
      catalogo_id: newCatalog.catalogo_id.toString(),
      tenant_id: newCatalog.tenant_id.toString(),
      productos: [],
      fecha_actualizacion: newCatalog.fecha_actualizacion
    });
    
  } catch (error) {
    console.error('Error creando catálogo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Eliminar un catálogo
async function deleteCatalog(req, res) {
  try {
    const { catalogId } = req.params;
    
    // Obtenemos el catálogo para tener información del tenant
    const catalog = await CatalogoModel.getById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catálogo no encontrado' });
    }
    
    // Guardamos el tenant_id para el mensaje de respuesta
    const sellerId = catalog.tenant_id;
    
    // Eliminamos el catálogo
    await CatalogoModel.delete(catalogId);
    
    // En lugar de status 204, enviamos un 200 con mensaje de confirmación
    res.status(200).json({
      message: `Catálogo ID ${catalogId} del seller ID ${sellerId} fue eliminado exitosamente`,
      deleted_catalog: {
        catalogo_id: catalogId,
        tenant_id: sellerId
      }
    });
    
  } catch (error) {
    console.error('Error eliminando catálogo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Obtener todos los productos de un catálogo
async function getCatalogProducts(req, res) {
  try {
    const { catalogId } = req.params;
    
    // Validamos que el catálogo exista
    const catalog = await CatalogoModel.getById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catálogo no encontrado' });
    }
    
    // Obtenemos los productos del catálogo
    const productos = await ProductoModel.getByCatalogoId(catalogId);
    
    // Formateamos los productos
    const productosFormateados = await formatearProductos(productos);
    
    res.json(productosFormateados);
    
  } catch (error) {
    console.error('Error obteniendo productos del catálogo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = {
  getSellerCatalogs,
  getCatalogById,
  createCatalog,
  deleteCatalog,
  getCatalogProducts
};
