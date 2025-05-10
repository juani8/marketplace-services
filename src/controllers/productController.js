const TenantModel = require('../models/tenant.model');
const CatalogoModel = require('../models/catalogo.model');
const ProductoModel = require('../models/producto.model');
const { formatearProductos } = require('../utils/formatters');

// Obtener todos los productos de un catálogo
async function getProducts(req, res) {
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
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Obtener un producto específico por ID
async function getProductById(req, res) {
  try {
    const { productId } = req.params;
    
    // Obtenemos el producto
    const producto = await ProductoModel.getById(productId);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Formateamos el producto
    const productosFormateados = await formatearProductos([producto]);
    
    res.json(productosFormateados[0]);
    
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Crear un nuevo producto
async function createProduct(req, res) {
  try {
    const { catalogId } = req.params;
    const { 
      nombre_producto, 
      descripcion, 
      precio, 
      cantidad_stock, 
      categoria,
      imagenes // Array de URLs
    } = req.body;

    // Validamos que el catálogo exista
    const catalog = await CatalogoModel.getById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catálogo no encontrado' });
    }

    // Validar datos requeridos
    if (!nombre_producto || !precio) {
      return res.status(400).json({ message: 'Nombre y precio son requeridos' });
    }

    // Crear el producto
    const productoData = {
      catalogo_id: parseInt(catalogId),
      nombre_producto,
      descripcion,
      precio,
      cantidad_stock,
      categoria
    };

    const newProduct = await ProductoModel.create(productoData);

    // Si hay imágenes, agregarlas a la tabla imagenes_producto
    if (imagenes && Array.isArray(imagenes)) {
      for (const url of imagenes) {
        await ProductoModel.addImagen({
          producto_id: newProduct.producto_id,
          url
        });
      }
    }

    // Actualizar fecha del catálogo
    await CatalogoModel.updateFechaActualizacion(catalogId);

    // Obtener el producto con toda su información
    const productos = await formatearProductos([newProduct]);
    
    res.status(201).json({
      message: 'Producto creado exitosamente',
      producto: productos[0]
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Actualizar un producto
async function updateProduct(req, res) {
  try {
    const { productId } = req.params;
    const updateData = req.body;

    // Obtenemos el producto para validar que exista
    const product = await ProductoModel.getById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Guardamos el catalog_id para actualizar la fecha después
    const catalogId = product.catalogo_id;

    // Actualizar el producto (sin las imágenes)
    const { imagenes, ...productoData } = updateData;
    const updatedProduct = await ProductoModel.update(productId, productoData);

    // Manejar las imágenes si se proporcionaron
    if (imagenes && Array.isArray(imagenes)) {
      // Eliminar imágenes anteriores
      await ProductoModel.deleteImagenes(productId);
      
      // Agregar nuevas imágenes
      for (const url of imagenes) {
        await ProductoModel.addImagen({
          producto_id: productId,
          url
        });
      }
    }

    // Actualizar fecha del catálogo
    await CatalogoModel.updateFechaActualizacion(catalogId);

    // Obtener el producto actualizado con toda su información
    const productos = await formatearProductos([updatedProduct]);
    
    res.json({
      message: 'Producto actualizado exitosamente',
      producto: productos[0]
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Eliminar un producto
async function deleteProduct(req, res) {
  try {
    const { productId } = req.params;
    
    // Obtenemos el producto antes de eliminarlo para tener su información
    const product = await ProductoModel.getById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Guardamos la información necesaria para la respuesta
    const catalogId = product.catalogo_id;
    const nombreProducto = product.nombre_producto;
    
    // Obtenemos info del catálogo para saber el seller_id
    const catalog = await CatalogoModel.getById(catalogId);
    if (!catalog) {
      // Si por alguna razón el catálogo no existe, igual borramos el producto
      await ProductoModel.delete(productId);
      return res.status(200).json({
        message: `Producto eliminado exitosamente`,
        deleted_product: {
          producto_id: productId,
          nombre_producto: nombreProducto
        }
      });
    }
    
    const sellerId = catalog.tenant_id;
    
    // Eliminamos el producto
    await ProductoModel.delete(productId);
    
    // Actualizar fecha del catálogo
    await CatalogoModel.updateFechaActualizacion(catalogId);
    
    // En lugar de status 204, enviamos un 200 con mensaje de confirmación
    res.status(200).json({
      message: `Producto eliminado exitosamente`,
      deleted_product: {
        seller_id: sellerId,
        catalogo_id: catalogId,
        producto_id: productId,
        nombre_producto: nombreProducto
      }
    });
    
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
