const OrderModel = require('../../models/order.model');
const ventasPublisher = require('../publishers/ventasPublisher');

/**
 * Calcula los montos de IVA para una orden
 * @param {number} total - Monto total con IVA
 * @returns {Object} Objeto con subtotal, montoIva y total
 */
function calcularMontos(total) {
  const subtotal = Number((total / 1.21).toFixed(2));
  const montoIva = Number((total - subtotal).toFixed(2));
  return { subtotal, montoIva, total };
}

/**
 * Maneja la solicitud de información de ventas mensuales
 * @param {Object} payload - Contiene fechaDesde y fechaHasta
 */
async function handle(payload) {
  try {
    const { fechaDesde, fechaHasta } = payload;

    // Buscar órdenes finalizadas en el rango de fechas
    const orders = await OrderModel.findFinalizadasByDateRange(fechaDesde, fechaHasta);

    // Transformar las órdenes al formato requerido
    const ventas = orders.map(order => {
      const montos = calcularMontos(Number(order.total));
      return {
        orden_id: order.orden_id,
        comercio_id: order.comercio_id,
        fecha_creacion: order.fecha_creacion,
        subtotal: montos.subtotal,
        monto_iva: montos.montoIva,
        total: montos.total,
        direccion_entrega: order.direccion_entrega,
        productos: order.productos.map(prod => {
          const montosProducto = calcularMontos(Number(prod.subtotal));
          return {
            producto_id: prod.producto_id,
            nombre: prod.nombre_producto,
            cantidad: prod.cantidad,
            precio_unitario: Number(prod.precio_unitario),
            subtotal: montosProducto.subtotal,
            monto_iva: montosProducto.montoIva,
            total: montosProducto.total
          };
        })
      };
    });

    // Ordenar por fecha de creación
    ventas.sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion));

    // Publicar respuesta
    const publishResult = await ventasPublisher.publishVentasMesResponse(ventas);
    
    if (!publishResult) {
      console.error('Error al publicar la respuesta de ventas mensuales');
      return false;
    }

    console.log('Respuesta de ventas mensuales publicada exitosamente');
    return true;

  } catch (error) {
    console.error('Error procesando solicitud de ventas mensuales:', error);
    return false;
  }
}

module.exports = {
  handle
}; 