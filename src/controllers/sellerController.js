const TenantModel = require('../models/tenant.model');
const SellerModel = require('../models/seller.model');
const ProductoModel = require('../models/producto.model');
const { geocodeAddress } = require('../services/geocodingService');
const {
  formatearHorarios,
  validarHorarios,
  parsearHorarios,
  crearHorariosCompletos
} = require('../services/timeServices');
const { publishSellerCreated, publishSellerUpdated } = require('../events/publishers/sellerPublisher');
const { publishStockUpdated } = require('../events/publishers/stockPublisher');

const DELIVERY_RADIUS_KM = 5; // Radio fijo de entrega

// GET /sellers?lat=X&lon=Y - Buscar sellers cercanos (original)
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

    // Buscar sellers cercanos usando comercios en lugar de tenants
    const sellers = await SellerModel.findNearby(latitude, longitude, DELIVERY_RADIUS_KM);

    // Obtener horarios para cada seller y formatearlos
    const sellersConHorarios = await Promise.all(
      sellers.map(async (seller) => {
        const horarios = await SellerModel.getHorarios(seller.comercio_id);
        return {
          ...seller,
          horarios: formatearHorarios(horarios)
        };
      })
    );

    res.json(sellersConHorarios);

  } catch (error) {
    console.error('Error buscando sellers cercanos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// ============ ENDPOINTS DE COMERCIOS ============

// GET /sellers - Obtener comercios del tenant
async function getComercios(req, res) {
  try {
    const usuario_id = req.user.usuario_id; // Obtenido del JWT
    const { page = 1, size = 10 } = req.query;

    const pageNum = parseInt(page);
    const sizeNum = parseInt(size);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ 
        success: false,
        message: 'El parámetro page debe ser un número mayor a 0' 
      });
    }

    if (isNaN(sizeNum) || sizeNum < 1 || sizeNum > 100) {
      return res.status(400).json({ 
        success: false,
        message: 'El parámetro size debe ser un número entre 1 y 100' 
      });
    }

    const result = await SellerModel.getByUser(usuario_id, pageNum, sizeNum);
    
    // Agregar horarios a cada comercio
    const comerciosConHorarios = await Promise.all(
      result.data.map(async (comercio) => {
        const horarios = await SellerModel.getHorarios(comercio.comercio_id);
        return {
          ...comercio,
          horarios: formatearHorarios(horarios)
        };
      })
    );

    res.json({
      success: true,
      data: comerciosConHorarios,
      pagination: {
        page: pageNum,
        size: sizeNum,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / sizeNum)
      }
    });

  } catch (error) {
    console.error('Error obteniendo comercios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
}

// GET /sellers/:id - Obtener un comercio específico
async function getComercioById(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de comercio inválido' 
      });
    }

    const comercio = await SellerModel.getById(parseInt(id));

    if (!comercio) {
      return res.status(404).json({ 
        success: false,
        message: 'Comercio no encontrado' 
      });
    }

    // Verificar que el comercio pertenece al tenant del usuario
    if (comercio.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este comercio'
      });
    }

    // Si no es admin, verificar que el usuario tiene acceso a este comercio
    if (req.user.rol !== 'admin' && !req.user.comercios_autorizados_id.includes(parseInt(id))) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este comercio'
      });
    }

    // Obtener y formatear horarios
    const horarios = await SellerModel.getHorarios(parseInt(id));
    comercio.horarios = formatearHorarios(horarios);

    res.json({
      success: true,
      data: comercio
    });

  } catch (error) {
    console.error('Error obteniendo comercio:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
}

// POST /sellers - Crear nuevo comercio
async function createComercio(req, res) {
  try {
    const { 
      nombre, 
      calle,
      numero,
      ciudad,
      provincia,
      codigo_postal,
      horarios
    } = req.body;

    const tenant_id = req.user.tenant_id; // Obtenido del JWT

    // Validaciones requeridas
    if (!nombre) {
      return res.status(400).json({ 
        success: false,
        message: 'nombre es campo requerido' 
      });
    }

    // Validar que los campos de dirección no sean null/undefined/vacíos si se proporcionan
    const camposInvalidos = [];
    
    // Si se proporciona algún campo de dirección, TODOS deben estar presentes y válidos
    const camposDireccion = { calle, numero, ciudad, provincia, codigo_postal };
    const camposDireccionDefinidos = Object.entries(camposDireccion).filter(([key, value]) => value !== undefined);
    
    if (camposDireccionDefinidos.length > 0) {
      // Si hay algún campo de dirección, validar que TODOS estén presentes
      if (calle === undefined || calle === null || calle === '') {
        camposInvalidos.push('calle es requerido cuando se proporciona dirección');
      }
      if (numero === undefined || numero === null || numero === '') {
        camposInvalidos.push('numero es requerido cuando se proporciona dirección');
      }
      if (ciudad === undefined || ciudad === null || ciudad === '') {
        camposInvalidos.push('ciudad es requerido cuando se proporciona dirección');
      }
      if (provincia === undefined || provincia === null || provincia === '') {
        camposInvalidos.push('provincia es requerido cuando se proporciona dirección');
      }
      if (codigo_postal === undefined || codigo_postal === null || codigo_postal === '') {
        camposInvalidos.push('codigo_postal es requerido cuando se proporciona dirección');
      }
    }

    if (camposInvalidos.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Campos de dirección inválidos o faltantes',
        errores: camposInvalidos
      });
    }

    // Validar horarios si se proporcionaron
    if (horarios !== undefined) {
      const validacion = validarHorarios(horarios);
      if (!validacion.valid) {
        return res.status(400).json({ 
          success: false,
          message: 'Errores en los horarios proporcionados',
          errores: validacion.errores
        });
      }
    }

    // Geocodificamos la dirección si se proporcionan los campos necesarios
    let lat, lon;
    if (calle && numero && ciudad && provincia) {
      try {
        const location = await geocodeAddress({
          calle,
          numero,
          ciudad,
          provincia,
          codigo_postal
        });
        lat = location.lat;
        lon = location.lon;
      } catch (geoError) {
        return res.status(400).json({ 
          success: false,
          message: 'Dirección inválida o no encontrada. Por favor verifica los datos ingresados.' 
        });
      }
    }

    // Crear el comercio
    const nuevoComercio = await SellerModel.create({
      tenant_id: parseInt(tenant_id),
      nombre: nombre.trim(),
      calle: calle?.trim(),
      numero: numero?.trim(),
      ciudad: ciudad?.trim(),
      provincia: provincia?.trim(),
      codigo_postal: codigo_postal?.trim(),
      lat,
      lon
    });

    // Crear horarios completos (7 días, con NULL para días no especificados)
    const horariosCompletos = crearHorariosCompletos(horarios);
    await SellerModel.updateHorarios(nuevoComercio.comercio_id, horariosCompletos);

    // Obtener el comercio con horarios para la respuesta
    const horariosComercio = await SellerModel.getHorarios(nuevoComercio.comercio_id);
    nuevoComercio.horarios = formatearHorarios(horariosComercio);

    // Publicar evento comercio.creado
    try {
      await publishSellerCreated(nuevoComercio);
    } catch (eventError) {
      console.error('Error publishing comercio.creado event:', eventError);
      // No devolver error al frontend, el comercio se creó correctamente
    }

    res.status(201).json({
      success: true,
      message: 'Comercio creado exitosamente. Los días sin horarios especificados se configuraron como cerrados.',
      data: nuevoComercio
    });

  } catch (error) {
    console.error('Error creando comercio:', error);
    
    if (error.message.includes('violates foreign key constraint')) {
      return res.status(400).json({ 
        success: false,
        message: 'El tenant_id especificado no existe' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
}

// PATCH /sellers/:id - Actualización parcial de comercio
async function patchComercio(req, res) {
  try {
    const { id } = req.params;
    let updateFields = { ...req.body };

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de comercio inválido' 
      });
    }

    if (!updateFields || Object.keys(updateFields).length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No se enviaron campos para actualizar.' 
      });
    }

    // Buscar el comercio existente
    const existingComercio = await SellerModel.getById(parseInt(id));
    if (!existingComercio) {
      return res.status(404).json({ 
        success: false,
        message: 'Comercio no encontrado.' 
      });
    }

    // Verificar que el comercio pertenece al tenant del usuario
    if (existingComercio.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar este comercio'
      });
    }

    // Si no es admin, verificar que el usuario tiene acceso a este comercio
    if (req.user.rol !== 'admin' && !req.user.comercios_autorizados_id.includes(parseInt(id))) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar este comercio'
      });
    }

    // Extraer horarios del update si están presentes
    const horarios = updateFields.horarios;
    delete updateFields.horarios;
    delete updateFields.comercio_id;
    delete updateFields.tenant_id;

    // Validar horarios si se proporcionaron
    if (horarios !== undefined) {
      const validacion = validarHorarios(horarios);
      if (!validacion.valid) {
        return res.status(400).json({ 
          success: false,
          message: 'Errores en los horarios proporcionados',
          errores: validacion.errores
        });
      }
    }

    // Si se actualiza algún campo de dirección, necesitamos todos los campos para geocodificar
    if (updateFields.calle || updateFields.numero || updateFields.ciudad || updateFields.provincia || updateFields.codigo_postal) {
      const direccion = {
        calle: updateFields.calle || existingComercio.calle,
        numero: updateFields.numero || existingComercio.numero,
        ciudad: updateFields.ciudad || existingComercio.ciudad,
        provincia: updateFields.provincia || existingComercio.provincia,
        codigo_postal: updateFields.codigo_postal || existingComercio.codigo_postal
      };

      // Solo geocodificar si tenemos los campos mínimos requeridos
      if (direccion.calle && direccion.numero && direccion.ciudad && direccion.provincia) {
        try {
          const { lat, lon } = await geocodeAddress(direccion);
          updateFields = {
            ...updateFields,
            lat,
            lon
          };
        } catch (geoError) {
          return res.status(400).json({ 
            success: false,
            message: 'Dirección inválida o no encontrada. Por favor verifica los datos ingresados.' 
          });
        }
      }
    }

    // Actualizar el comercio si hay campos que actualizar
    let updatedComercio = existingComercio;
    if (Object.keys(updateFields).length > 0) {
      updatedComercio = await SellerModel.patch(parseInt(id), updateFields);
    }

    // Actualizar horarios si se proporcionaron
    let mensajeHorarios = '';
    if (horarios !== undefined) {
      if (Array.isArray(horarios) && horarios.length > 0) {
        // Solo actualizar los días especificados (actualización parcial)
        const horariosParsed = parsearHorarios(horarios);
        
        for (const horario of horariosParsed) {
          await SellerModel.updateHorario(
            parseInt(id), 
            horario.dia_semana, 
            horario.hora_apertura, 
            horario.hora_cierre, 
            horario.estado
          );
        }
        mensajeHorarios = ` Horarios actualizados para los días especificados.`;
      } else {
        // Si se envía array vacío, crear horarios completos cerrados
        const horariosCompletos = crearHorariosCompletos([]);
        await SellerModel.updateHorarios(parseInt(id), horariosCompletos);
        mensajeHorarios = ` Todos los horarios configurados como cerrados.`;
      }
    }

    // Obtener horarios actualizados para la respuesta
    const horariosActualizados = await SellerModel.getHorarios(parseInt(id));
    updatedComercio.horarios = formatearHorarios(horariosActualizados);

    // Publicar evento comercio.actualizado
    try {
      await publishSellerUpdated(updatedComercio);
    } catch (eventError) {
      console.error('Error publishing comercio.actualizado event:', eventError);
      // No devolver error al frontend, el comercio se actualizó correctamente
    }

    res.json({
      success: true,
      message: `Comercio actualizado exitosamente.${mensajeHorarios}`,
      data: updatedComercio
    });

  } catch (error) {
    console.error('Error actualizando comercio:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor.' 
    });
  }
}

// DELETE /sellers/:id - Eliminar comercio
async function deleteComercio(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de comercio inválido' 
      });
    }

    // Verificar que el comercio existe y obtener sus datos
    const comercio = await SellerModel.getById(parseInt(id));
    if (!comercio) {
      return res.status(404).json({ 
        success: false,
        message: 'Comercio no encontrado' 
      });
    }

    // Verificar que el comercio pertenece al tenant del usuario
    if (comercio.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este comercio'
      });
    }

    // Si no es admin, verificar que el usuario tiene acceso a este comercio
    if (req.user.rol !== 'admin' && !req.user.comercios_autorizados_id.includes(parseInt(id))) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este comercio'
      });
    }

    const comercioEliminado = await SellerModel.delete(parseInt(id));

    res.json({
      success: true,
      message: 'Comercio eliminado exitosamente',
      data: comercioEliminado
    });

  } catch (error) {
    console.error('Error eliminando comercio:', error);
    
    if (error.message === 'Comercio no encontrado') {
      return res.status(404).json({ 
        success: false,
        message: 'Comercio no encontrado' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
}

// ============ ENDPOINTS DE PRODUCTOS Y STOCK ============

// GET /sellers/:id/products - Obtener productos del comercio con stock
async function getComercioProducts(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de comercio inválido' 
      });
    }

    const comercioId = parseInt(id);

    // Verificar que el comercio existe
    const comercio = await SellerModel.getById(comercioId);
    if (!comercio) {
      return res.status(404).json({ 
        success: false,
        message: 'Comercio no encontrado' 
      });
    }

    // Verificar que el comercio pertenece al tenant del usuario
    if (comercio.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este comercio'
      });
    }

    // Si no es admin, verificar que el usuario tiene acceso a este comercio
    if (req.user.rol !== 'admin' && !req.user.comercios_autorizados_id.includes(comercioId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este comercio'
      });
    }

    // Obtener productos con stock
    const productos = await SellerModel.getProductsWithStock(comercioId);

    // Agregar imágenes y promociones a cada producto
    const productosConDetalles = await Promise.all(
      productos.map(async (producto) => {
        const [imagenes, promociones] = await Promise.all([
          ProductoModel.getImagenes(producto.producto_id),
          ProductoModel.getPromociones(producto.producto_id)
        ]);

        return {
          ...producto,
          imagenes,
          promociones
        };
      })
    );

    res.json({
      success: true,
      data: {
        comercio: {
          comercio_id: comercio.comercio_id,
          nombre: comercio.nombre,
          tenant_id: comercio.tenant_id
        },
        productos: productosConDetalles
      }
    });

  } catch (error) {
    console.error('Error obteniendo productos del comercio:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
}

// GET /sellers/:id/products/:productId/stock - Obtener stock específico de un producto
async function getProductStock(req, res) {
  try {
    const { id, productId } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de comercio inválido' 
      });
    }

    if (!productId || isNaN(parseInt(productId))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de producto inválido' 
      });
    }

    const comercioId = parseInt(id);
    const productoId = parseInt(productId);

    // Verificar que el comercio existe
    const comercio = await SellerModel.getById(comercioId);
    if (!comercio) {
      return res.status(404).json({ 
        success: false,
        message: 'Comercio no encontrado' 
      });
    }

    // Verificar que el comercio pertenece al tenant del usuario
    if (comercio.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este comercio'
      });
    }

    // Si no es admin, verificar que el usuario tiene acceso a este comercio
    if (req.user.rol !== 'admin' && !req.user.comercios_autorizados_id.includes(comercioId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este comercio'
      });
    }

    // Verificar que el producto existe y pertenece al tenant del comercio
    const producto = await ProductoModel.getById(productoId);
    if (!producto) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado' 
      });
    }

    if (producto.tenant_id !== comercio.tenant_id) {
      return res.status(400).json({ 
        success: false,
        message: 'El producto no pertenece al tenant del comercio' 
      });
    }

    // Obtener stock específico
    const stock = await SellerModel.getProductStock(comercioId, productoId);

    if (!stock) {
      // Si no hay registro de stock, devolver stock 0
      return res.json({
        success: true,
        data: {
          comercio_id: comercioId,
          producto_id: productoId,
          cantidad_stock: 0,
          producto_nombre: producto.nombre_producto,
          comercio_nombre: comercio.nombre
        }
      });
    }

    res.json({
      success: true,
      data: stock
    });

  } catch (error) {
    console.error('Error obteniendo stock del producto:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
}

// PATCH /sellers/:id/products/:productId/stock - Actualizar stock de un producto
async function updateProductStock(req, res) {
  try {
    const { id, productId } = req.params;
    const { cantidad_stock } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de comercio inválido' 
      });
    }

    if (!productId || isNaN(parseInt(productId))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de producto inválido' 
      });
    }

    if (cantidad_stock === undefined || cantidad_stock === null || isNaN(parseInt(cantidad_stock))) {
      return res.status(400).json({ 
        success: false,
        message: 'cantidad_stock es requerida y debe ser un número válido' 
      });
    }

    const cantidadStock = parseInt(cantidad_stock);

    if (cantidadStock < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'La cantidad de stock no puede ser negativa' 
      });
    }

    const comercioId = parseInt(id);
    const productoId = parseInt(productId);

    // Verificar que el comercio existe
    const comercio = await SellerModel.getById(comercioId);
    if (!comercio) {
      return res.status(404).json({ 
        success: false,
        message: 'Comercio no encontrado' 
      });
    }

    // Verificar que el comercio pertenece al tenant del usuario
    if (comercio.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este comercio'
      });
    }

    // Si no es admin, verificar que el usuario tiene acceso a este comercio
    if (req.user.rol !== 'admin' && !req.user.comercios_autorizados_id.includes(comercioId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este comercio'
      });
    }

    // Verificar que el producto existe
    const producto = await ProductoModel.getById(productoId);
    if (!producto) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado' 
      });
    }

    // Obtener stock anterior para el evento
    const stockAnterior = await SellerModel.getProductStock(comercioId, productoId);
    const cantidadAnterior = stockAnterior ? stockAnterior.cantidad_stock : 0;

    // Actualizar stock
    const stockActualizado = await SellerModel.updateProductStock(comercioId, productoId, cantidadStock);

    // Publicar evento stock.actualizado
    try {
      const stockEventData = {
        comercio_id: comercioId,
        comercio_nombre: comercio.nombre,
        tenant_id: comercio.tenant_id,
        producto_id: productoId,
        nombre_producto: producto.nombre_producto,
        descripcion: producto.descripcion,
        precio: producto.precio,
        categoria_id: producto.categoria_id,
        categoria_nombre: producto.categoria_nombre || null,
        cantidad_anterior: cantidadAnterior,
        cantidad_nueva: cantidadStock
      };
      await publishStockUpdated(stockEventData);
    } catch (eventError) {
      console.error('Error publishing stock.actualizado event:', eventError);
      // No devolver error al frontend, el stock se actualizó correctamente
    }

    res.json({
      success: true,
      message: 'Stock actualizado exitosamente',
      data: {
        comercio_id: stockActualizado.comercio_id,
        producto_id: stockActualizado.producto_id,
        cantidad_stock: stockActualizado.cantidad_stock,
        producto_nombre: producto.nombre_producto,
        comercio_nombre: comercio.nombre
      }
    });

  } catch (error) {
    console.error('Error actualizando stock del producto:', error);
    
    if (error.message === 'Producto no pertenece al tenant del comercio') {
      return res.status(400).json({ 
        success: false,
        message: 'El producto no pertenece al tenant del comercio' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
}

module.exports = { 
  getSellersNearby,
  getComercios,
  getComercioById,
  createComercio,
  patchComercio,
  deleteComercio,
  getComercioProducts,
  getProductStock,
  updateProductStock
};
