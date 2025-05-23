const TenantModel = require('../models/tenant.model');
const CatalogoModel = require('../models/catalogo.model');
const ProductoModel = require('../models/producto.model');
const { formatearProductos } = require('../utils/formatters');
const ImageUploadService = require('../services/imageUploadService');
const upload = require('../config/multerConfig');

// Obtener todos los productos de un tenant
async function getProducts(req, res) {
  try {
    const tenantId = 1; // tenantId, se deberia obtener del JWT cuando esté implementado.
    // Obtenemos los productos del catálogo
    const productos = await ProductoModel.getProductsByTenantId(tenantId);
    
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
    const { 
      nombre_producto, 
      descripcion, 
      precio, 
      cantidad_stock, 
      categoria_id
    } = req.body;

    const tenantId = 1; // tenantId, se deberia obtener del JWT cuando esté implementado.

    // Validar datos requeridos
    if (!nombre_producto || !precio) {
      return res.status(400).json({ message: 'Nombre y precio son requeridos' });
    }

    // Procesar las imágenes si existen
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await ImageUploadService.uploadMultipleImages(req.files);
    }

    // Crear el producto
    const productoData = {
      tenant_id: tenantId,
      nombre_producto,
      descripcion,
      precio,
      cantidad_stock,
      categoria_id
    };

    const newProduct = await ProductoModel.create(productoData);

    // Agregar las URLs de las imágenes a la base de datos
    if (imageUrls.length > 0) {
      for (const url of imageUrls) {
        await ProductoModel.addImagen({
          producto_id: newProduct.producto_id,
          url
        });
      }
    }

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

    // Procesar las nuevas imágenes si existen
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await ImageUploadService.uploadMultipleImages(req.files);
    }

    // Actualizar el producto (sin las imágenes)
    const { imagenes, ...productoData } = updateData;
    const updatedProduct = await ProductoModel.update(productId, productoData);

    // Manejar las imágenes
    if (imageUrls.length > 0) {
      // Eliminar imágenes anteriores
      await ProductoModel.deleteImagenes(productId);
      
      // Agregar nuevas imágenes
      for (const url of imageUrls) {
        await ProductoModel.addImagen({
          producto_id: productId,
          url
        });
      }
    }

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
    const nombreProducto = product.nombre_producto;
    const tenantId = product.tenant_id;
    
    // Eliminamos el producto
    await ProductoModel.delete(productId);
    
    // En lugar de status 204, enviamos un 200 con mensaje de confirmación
    res.status(200).json({
      message: `Producto eliminado exitosamente`,
      deleted_product: {
        tenant_id: tenantId,
        producto_id: productId,
        nombre_producto: nombreProducto
      }
    });
    
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Middleware de multer para las rutas que manejan imágenes
createProduct.upload = upload.array('imagenes', 5); // Máximo 5 imágenes
updateProduct.upload = upload.array('imagenes', 5);

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
