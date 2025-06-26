const TenantModel = require('../models/tenant.model');
const CatalogoModel = require('../models/catalogo.model');
const ProductoModel = require('../models/producto.model');
const { formatearProductos } = require('../utils/formatters');
const ImageUploadService = require('../services/imageUploadService');
const upload = require('../config/multerConfig');
const uploadCSV = require('../config/csvMulterConfig');
const { requireAdmin } = require('../middlewares/authMiddleware');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Obtener todos los productos de un tenant
async function getProducts(req, res) {
  try {
    const tenantId = req.user.tenant_id; // Obtenido del JWT

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

    // Verificar que el producto pertenece al tenant del usuario
    if (producto.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a este producto' });
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
      categoria_id
    } = req.body;

    const tenantId = req.user.tenant_id; // Obtenido del JWT

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

    // Verificar que el producto pertenece al tenant del usuario
    if (product.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ message: 'No tienes permisos para modificar este producto' });
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

    // Verificar que el producto pertenece al tenant del usuario
    if (product.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ message: 'No tienes permisos para eliminar este producto' });
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

// ============ CARGA MASIVA DE PRODUCTOS DESDE CSV ============

// Obtener template CSV para carga masiva
async function getCSVTemplate(req, res) {
  try {
    // Obtener categorías disponibles para incluir en la respuesta
    const categorias = await ProductoModel.getCategorias();
    
    const csvTemplate = `nombre_producto,descripcion,precio,categoria_id
Pizza Margherita,Pizza clásica con tomate y mozzarella,850.50,1
Hamburguesa Completa,Hamburguesa con carne queso y vegetales,1200.00,2
Café Latte,Café con leche espumosa,450.75,3`;

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="template_productos.csv"'
    });

    res.status(200).json({
      success: true,
      message: 'Template CSV para carga masiva de productos',
      template: csvTemplate,
      categorias_disponibles: categorias,
      instrucciones: {
        formato: 'El archivo debe tener las columnas: nombre_producto, descripcion, precio, categoria_id',
        campos_requeridos: ['nombre_producto', 'precio'],
        campos_opcionales: ['descripcion', 'categoria_id'],
        notas: [
          'La primera fila debe contener los nombres de las columnas',
          'precio debe ser un número positivo (usar punto como separador decimal)',
          'categoria_id debe ser un número entero válido de las categorías existentes',
          'descripcion puede estar vacía',
          'Si categoria_id está vacío, el producto se creará sin categoría'
        ]
      }
    });

  } catch (error) {
    console.error('Error obteniendo template CSV:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
}

// Procesar archivo CSV para carga masiva
async function uploadProductsCSV(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo CSV'
      });
    }

    const tenantId = req.user.tenant_id; // Viene del middleware requireAdmin
    const productosData = [];

    // Convertir buffer a stream y procesar CSV
    const stream = Readable.from(req.file.buffer.toString());
    
    const csvPromise = new Promise((resolve, reject) => {
      const productos = [];
      
      stream
        .pipe(csv())
        .on('data', (row) => {
          // Limpiar espacios en blanco de las claves y valores
          const cleanRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim();
            const cleanValue = row[key] ? row[key].trim() : '';
            cleanRow[cleanKey] = cleanValue;
          });
          
          productos.push(cleanRow);
        })
        .on('end', () => {
          resolve(productos);
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    const productosCSV = await csvPromise;

    if (productosCSV.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El archivo CSV está vacío o no tiene el formato correcto'
      });
    }

    // Validar que tenga las columnas requeridas
    const primeraFila = productosCSV[0];
    const columnasRequeridas = ['nombre_producto', 'precio'];
    const columnasFaltantes = columnasRequeridas.filter(col => !(col in primeraFila));

    if (columnasFaltantes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Faltan columnas requeridas en el CSV: ${columnasFaltantes.join(', ')}`,
        columnas_encontradas: Object.keys(primeraFila),
        columnas_requeridas: columnasRequeridas
      });
    }

    // Procesar los productos
    const resultado = await ProductoModel.createBulk(productosCSV, tenantId);

    // Formatear productos creados si existen
    if (resultado.productos_creados.length > 0) {
      const productosFormateados = await Promise.all(
        resultado.productos_creados.map(async (item) => {
          const productos = await formatearProductos([item.producto]);
          return {
            fila: item.fila,
            producto: productos[0]
          };
        })
      );
      resultado.productos_creados = productosFormateados;
    }

    // Determinar código de respuesta
    const statusCode = resultado.total_errores > 0 ? 
      (resultado.total_exitosos > 0 ? 207 : 400) : // 207 = Multi-Status, 400 = Bad Request
      201; // 201 = Created

    res.status(statusCode).json({
      success: resultado.total_exitosos > 0,
      message: `Procesamiento completado. ${resultado.total_exitosos} productos creados, ${resultado.total_errores} errores`,
      data: resultado,
      usuario_procesamiento: {
        usuario_id: req.user.usuario_id,
        nombre: req.user.nombre,
        rol: req.user.rol
      }
    });

  } catch (error) {
    console.error('Error procesando CSV:', error);
    
    if (error.message.includes('CSV')) {
      return res.status(400).json({
        success: false,
        message: 'Error procesando archivo CSV. Verifica el formato del archivo.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Middleware de multer para las rutas que manejan imágenes
createProduct.upload = upload.array('imagenes', 5); // Máximo 5 imágenes
updateProduct.upload = upload.array('imagenes', 5);

// Middleware de multer para CSV (solo admin)
uploadProductsCSV.upload = uploadCSV.single('csv');
uploadProductsCSV.requireAdmin = requireAdmin;

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCSVTemplate,
  uploadProductsCSV
};
