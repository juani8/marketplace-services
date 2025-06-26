const OrderModel = require('../../models/order.model');
const ivaPublisher = require('../publishers/ivaPublisher');

/**
 * Maneja la solicitud de información de IVA para pedidos en un rango de fechas
 * @param {Object} payload - Contiene fechaDesde y fechaHasta
 */
async function handle(payload) {
  try {
    const { fechaDesde, fechaHasta } = payload;

    // Buscar pedidos en el rango de fechas usando el modelo
    const orders = await OrderModel.findByDateRange(fechaDesde, fechaHasta);

    // Transformar los pedidos al formato requerido
    const pedidosIva = orders.map(order => ({
      pedidoId: order.orden_id,
      fecha: order.fecha_creacion,
      subtotal: Number((order.total / 1.21).toFixed(2)), // Calculamos subtotal desde el total
      montoIva: Number((order.total - order.total / 1.21).toFixed(2)),
      total: Number(order.total)
    }));

    // Publicar respuesta
    const publishResult = await ivaPublisher.publishIvaResponse(pedidosIva);
    
    if (!publishResult) {
      console.error('Error al publicar la respuesta IVA');
      return false;
    }

    console.log('Respuesta IVA publicada exitosamente');
    return true;

  } catch (error) {
    console.error('Error procesando solicitud de IVA:', error);
    return false;
  }
}

module.exports = {
  handle
};
