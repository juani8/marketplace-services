const { publishIvaResponse } = require('../publishers/ivaPublisher');
const OrderModel = require('../../models/order.model');

/**
 * Maneja el evento iva.pedido y responde con el cálculo de IVA
 * @param {Object} eventData - Datos del evento recibido
 */
async function handle(eventData) {
  try {
    console.log('Procesando pedido para IVA:', eventData);
    
    // Obtener la orden de la base de datos
    const order = await OrderModel.getById(eventData.id);
    console.log('Orden encontrada:', order);
    
    if (!order) {
      console.error(`No se encontró la orden con ID ${eventData.id}`);
      return false;
    }

    // Procesar el pedido y desglosar IVA
    const total = parseFloat(order.total);
    const subtotal = total / 1.21; // Como el total incluye IVA (21%), dividimos por 1.21
    const montoIva = total - subtotal;

    const pedidoConIva = {
      pedido_id: order.orden_id,
      fecha: order.fecha_creacion,
      subtotal: Number(subtotal.toFixed(2)),
      montoIva: Number(montoIva.toFixed(2)),
      total: total
    };

    console.log('Pedido procesado con IVA:', pedidoConIva);

    // Publicar respuesta con los cálculos
    const publishResult = await publishIvaResponse([pedidoConIva]);
    
    if (!publishResult) {
      console.error('Error al publicar la respuesta IVA');
      return false;
    }

    console.log('Respuesta IVA publicada exitosamente');
    return true;
  } catch (error) {
    console.error('Error procesando iva.pedido:', error);
    return false;
  }
}

module.exports = {
  handle
};
