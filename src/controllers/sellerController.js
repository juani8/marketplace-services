const TenantModel = require('../models/tenant.model');
const CatalogoModel = require('../models/catalogo.model');
const ProductoModel = require('../models/producto.model');

const DELIVERY_RADIUS_KM = 5; // Radio fijo de entrega

async function getSellersNearby(req, res) {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ message: 'Latitud y longitud son requeridas.' });
    }

    // Convertimos lat y lon a número
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: 'Latitud o longitud inválidas.' });
    }

    // Buscar sellers cercanos
    const sellers = await TenantModel.findNearbySellers(latitude, longitude, DELIVERY_RADIUS_KM);

    res.json(sellers);

  } catch (error) {
    console.error('Error buscando sellers cercanos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Función auxiliar para formatear productos con su información completa
async function formatearProductos(productos) {
  const productosFormateados = [];
  
  for (const producto of productos) {
    try {
      // Obtener imágenes y promociones usando los métodos del modelo
      const imagenes = await ProductoModel.getImagenes(producto.producto_id) || [];
      const promociones = await ProductoModel.getPromociones(producto.producto_id) || [];
      
      // Formatear las promociones con verificación de valores
      const promocionesFormateadas = promociones.map(promo => {
        if (!promo) return null;
        
        return {
          promocion_id: promo.promocion_id ? String(promo.promocion_id) : "",
          tenant_id: String(producto.catalogo_id), // Usamos catalogo_id en lugar de tenant_id
          nombre: promo.nombre || "",
          descripcion: promo.descripcion || "",
          tipo_promocion: promo.tipo_promocion || "",
          fecha_inicio: promo.fecha_inicio || null,
          fecha_fin: promo.fecha_fin || null,
          productos_incluidos: [String(producto.producto_id)],
          estado: promo.estado || "activa"
        };
      }).filter(promo => promo !== null); // Eliminar valores nulos
      
      // Añadir el producto formateado
      productosFormateados.push({
        producto_id: String(producto.producto_id),
        nombre_producto: producto.nombre_producto || "",
        descripcion: producto.descripcion || "",
        precio: producto.precio || 0,
        cantidad_stock: producto.cantidad_stock || 0,
        categoria: producto.categoria || "",
        imagenes: imagenes,
        promociones: promocionesFormateadas
      });
    } catch (error) {
      console.error('Error formateando producto:', producto, error);
      // Continuar con el siguiente producto
    }
  }
  
  return productosFormateados;
}

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
    const { sellerId, catalogId } = req.params;
    
    // Validamos que el seller exista
    const seller = await TenantModel.getById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller no encontrado' });
    }
    
    // Obtenemos el catálogo
    const catalog = await CatalogoModel.getById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catálogo no encontrado' });
    }
    
    // Verificamos que el catálogo pertenezca al seller
    if (catalog.tenant_id !== parseInt(sellerId)) {
      return res.status(403).json({ message: 'El catálogo no pertenece a este seller' });
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
    const { sellerId, catalogId } = req.params;
    
    // Validamos que el seller exista
    const seller = await TenantModel.getById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller no encontrado' });
    }
    
    // Obtenemos el catálogo
    const catalog = await CatalogoModel.getById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catálogo no encontrado' });
    }
    
    // Verificamos que el catálogo pertenezca al seller
    if (catalog.tenant_id !== parseInt(sellerId)) {
      return res.status(403).json({ message: 'El catálogo no pertenece a este seller' });
    }
    
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
async function getProducts(req, res) {
  try {
    const { sellerId, catalogId } = req.params;
    
    // Validamos que el seller exista
    const seller = await TenantModel.getById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller no encontrado' });
    }
    
    // Validamos que el catálogo exista
    const catalog = await CatalogoModel.getById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catálogo no encontrado' });
    }
    
    // Verificamos que el catálogo pertenezca al seller
    if (catalog.tenant_id !== parseInt(sellerId)) {
      return res.status(403).json({ message: 'El catálogo no pertenece a este seller' });
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
    const { sellerId, catalogId, productId } = req.params;
    
    // Validamos que el seller exista
    const seller = await TenantModel.getById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller no encontrado' });
    }
    
    // Validamos que el catálogo exista
    const catalog = await CatalogoModel.getById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catálogo no encontrado' });
    }
    
    // Verificamos que el catálogo pertenezca al seller
    if (catalog.tenant_id !== parseInt(sellerId)) {
      return res.status(403).json({ message: 'El catálogo no pertenece a este seller' });
    }
    
    // Obtenemos el producto
    const producto = await ProductoModel.getById(productId);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Verificamos que el producto pertenezca al catálogo
    if (producto.catalogo_id !== parseInt(catalogId)) {
      return res.status(403).json({ message: 'El producto no pertenece a este catálogo' });
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
    const { sellerId, catalogId } = req.params;
    const { 
      nombre_producto, 
      descripcion, 
      precio, 
      cantidad_stock, 
      categoria,
      imagenes // Array de URLs
    } = req.body;

    // Validar seller y catálogo
    const seller = await TenantModel.getById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller no encontrado' });
    }

    const catalog = await CatalogoModel.getById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catálogo no encontrado' });
    }

    if (catalog.tenant_id !== parseInt(sellerId)) {
      return res.status(403).json({ message: 'El catálogo no pertenece a este seller' });
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
    const { sellerId, catalogId, productId } = req.params;
    const updateData = req.body;

    // Validaciones
    const seller = await TenantModel.getById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller no encontrado' });
    }

    const catalog = await CatalogoModel.getById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catálogo no encontrado' });
    }

    if (catalog.tenant_id !== parseInt(sellerId)) {
      return res.status(403).json({ message: 'El catálogo no pertenece a este seller' });
    }

    const product = await ProductoModel.getById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (product.catalogo_id !== parseInt(catalogId)) {
      return res.status(403).json({ message: 'El producto no pertenece a este catálogo' });
    }

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
    const { sellerId, catalogId, productId } = req.params;
    
    // Validamos que el seller exista
    const seller = await TenantModel.getById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller no encontrado' });
    }
    
    // Validamos que el catálogo exista
    const catalog = await CatalogoModel.getById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catálogo no encontrado' });
    }
    
    // Verificamos que el catálogo pertenezca al seller
    if (catalog.tenant_id !== parseInt(sellerId)) {
      return res.status(403).json({ message: 'El catálogo no pertenece a este seller' });
    }
    
    // Obtenemos el producto antes de eliminarlo para tener su información
    const product = await ProductoModel.getById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    if (product.catalogo_id !== parseInt(catalogId)) {
      return res.status(403).json({ message: 'El producto no pertenece a este catálogo' });
    }
    
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
        nombre_producto: product.nombre_producto
      }
    });
    
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = { 
  getSellersNearby,
  getSellerCatalogs,
  getCatalogById,
  createCatalog,
  deleteCatalog,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
