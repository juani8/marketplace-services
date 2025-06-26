// src/controllers/promotionController.js
const PromocionModel = require('../models/promocion.model');
const ProductoModel = require('../models/producto.model');

// TENANT_ID se obtiene del JWT en cada función

// Crear una nueva promoción
async function createPromotion(req, res) {
  try {
    const TENANT_ID = req.user.tenant_id; // Obtenido del JWT
    
    const {
      nombre,
      tipo_promocion,
      valor_descuento,
      lista_productos,
      fecha_inicio,
      fecha_fin
    } = req.body;

    // Validaciones básicas
    if (!nombre || !tipo_promocion || !valor_descuento || !lista_productos || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        message: 'Nombre, tipo de promoción, valor de descuento, lista de productos, fecha de inicio y fecha de fin son requeridos' 
      });
    }

    // Validar tipo de promoción
    if (!['monto', 'porcentaje'].includes(tipo_promocion)) {
      return res.status(400).json({ 
        message: 'Tipo de promoción debe ser "monto" o "porcentaje"' 
      });
    }

    // Validar que la lista de productos no esté vacía
    if (!Array.isArray(lista_productos) || lista_productos.length === 0) {
      return res.status(400).json({ 
        message: 'Debe proporcionar al menos un producto' 
      });
    }

    // Validar que todos los productos existan y pertenezcan al tenant
    for (const producto_id of lista_productos) {
      const producto = await ProductoModel.getById(producto_id);
      if (!producto) {
        return res.status(404).json({ 
          message: `Producto con ID ${producto_id} no encontrado` 
        });
      }
      if (producto.tenant_id !== TENANT_ID) {
        return res.status(403).json({ 
          message: `Producto con ID ${producto_id} no pertenece a este tenant` 
        });
      }
    }

    // Validar fechas
    const fechaInicio = new Date(fecha_inicio);
    const fechaFin = new Date(fecha_fin);
    
    if (fechaInicio >= fechaFin) {
      return res.status(400).json({ 
        message: 'La fecha de inicio debe ser anterior a la fecha de fin' 
      });
    }

    // Crear la promoción
    const promocionData = {
      nombre,
      tipo_promocion,
      valor_descuento,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    };

    const nuevaPromocion = await PromocionModel.create(promocionData);

    // Asociar productos a la promoción
    for (const producto_id of lista_productos) {
      await PromocionModel.agregarProducto(nuevaPromocion.promocion_id, producto_id);
    }

    // Obtener la promoción completa con productos
    const productos = await PromocionModel.getProductosPorPromocion(nuevaPromocion.promocion_id, TENANT_ID);

    res.status(201).json({
      message: 'Promoción creada exitosamente',
      promocion: {
        ...nuevaPromocion,
        productos
      }
    });

  } catch (error) {
    console.error('Error creando promoción:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Obtener todas las promociones del tenant
async function getAllPromotions(req, res) {
  try {
    const TENANT_ID = req.user.tenant_id; // Obtenido del JWT
    
    const promociones = await PromocionModel.getAll(TENANT_ID);
    
    // Agregar productos a cada promoción
    const promocionesCompletas = await Promise.all(
      promociones.map(async (promocion) => {
        const productos = await PromocionModel.getProductosPorPromocion(promocion.promocion_id, TENANT_ID);
        return {
          ...promocion,
          productos
        };
      })
    );

    res.json(promocionesCompletas);
  } catch (error) {
    console.error('Error obteniendo promociones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Actualizar promoción
async function updatePromotion(req, res) {
  try {
    const TENANT_ID = req.user.tenant_id; // Obtenido del JWT
    
    const { promotionId } = req.params;
    const {
      nombre,
      tipo_promocion,
      valor_descuento,
      lista_productos,
      fecha_inicio,
      fecha_fin
    } = req.body;

    // Verificar que la promoción existe y pertenece al tenant
    const perteneceTenant = await PromocionModel.verificarPromocionTenant(promotionId, TENANT_ID);
    if (!perteneceTenant) {
      return res.status(404).json({ message: 'Promoción no encontrada o no pertenece a este tenant' });
    }

    // Validar tipo de promoción si se proporciona
    if (tipo_promocion && !['monto', 'porcentaje'].includes(tipo_promocion)) {
      return res.status(400).json({ 
        message: 'Tipo de promoción debe ser "monto" o "porcentaje"' 
      });
    }

    // Si se proporcionan productos, validar que pertenezcan al tenant
    if (lista_productos && Array.isArray(lista_productos)) {
      for (const producto_id of lista_productos) {
        const producto = await ProductoModel.getById(producto_id);
        if (!producto || producto.tenant_id !== TENANT_ID) {
          return res.status(403).json({ 
            message: `Producto con ID ${producto_id} no encontrado o no pertenece a este tenant` 
          });
        }
      }
    }

    // Crear objeto con solo los campos proporcionados para actualización
    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (tipo_promocion !== undefined) updateData.tipo_promocion = tipo_promocion;
    if (valor_descuento !== undefined) updateData.valor_descuento = valor_descuento;
    if (fecha_inicio !== undefined) updateData.fecha_inicio = fecha_inicio;
    if (fecha_fin !== undefined) updateData.fecha_fin = fecha_fin;

    const promocionActualizada = await PromocionModel.update(promotionId, updateData);

    // Si se proporciona nueva lista de productos, actualizar asociaciones
    if (lista_productos && Array.isArray(lista_productos)) {
      // Primero obtener productos actuales
      const productosActuales = await PromocionModel.getProductosPorPromocion(promotionId, TENANT_ID);
      const productosActualesIds = productosActuales.map(p => p.producto_id);

      // Quitar productos que ya no están en la nueva lista
      for (const producto_id of productosActualesIds) {
        if (!lista_productos.includes(producto_id)) {
          await PromocionModel.quitarProducto(promotionId, producto_id);
        }
      }

      // Agregar productos nuevos
      for (const producto_id of lista_productos) {
        if (!productosActualesIds.includes(producto_id)) {
          await PromocionModel.agregarProducto(promotionId, producto_id);
        }
      }
    }

    // Obtener promoción actualizada con productos
    const productos = await PromocionModel.getProductosPorPromocion(promotionId, TENANT_ID);

    res.json({
      message: 'Promoción actualizada exitosamente',
      promocion: {
        ...promocionActualizada,
        productos
      }
    });

  } catch (error) {
    console.error('Error actualizando promoción:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Eliminar promoción
async function deletePromotion(req, res) {
  try {
    const TENANT_ID = req.user.tenant_id; // Obtenido del JWT
    
    const { promotionId } = req.params;
    
    // Verificar que la promoción existe y pertenece al tenant
    const perteneceTenant = await PromocionModel.verificarPromocionTenant(promotionId, TENANT_ID);
    if (!perteneceTenant) {
      return res.status(404).json({ message: 'Promoción no encontrada o no pertenece a este tenant' });
    }

    await PromocionModel.delete(promotionId);

    res.json({
      message: 'Promoción eliminada exitosamente',
      deleted_promotion_id: promotionId
    });

  } catch (error) {
    console.error('Error eliminando promoción:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = {
  createPromotion,
  getAllPromotions,
  updatePromotion,
  deletePromotion
};