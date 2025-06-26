const { getTimestamp } = require('../utils/getTimestamp');
const { publishEvent } = require('../utils/publishEvent');
const OrderModel = require('../../models/order.model');
const { publishStockUpdated } = require('../publishers/stockPublisher');

/**
 * Maneja el evento delivery.failed y actualiza el estado de la orden
 * @param {Object} eventData - Datos del evento recibido
 */
async function handle(eventData) {
  try {
    console.log('Procesando delivery.failed para orden:', eventData.orden_id);

    // Recuperar stock de la orden cancelada
    const stockRecuperado = await OrderModel.recoverStock(eventData.orden_id);
    
    if (!stockRecuperado) {
      throw new Error(`No se pudo recuperar el stock para la orden ${eventData.orden_id}`);
    }

    // Publicar evento de orden cancelada
    await publishEvent({
      topic: 'orden.cancelada',
      payload: {
        orden_id: eventData.orden_id,
        fecha_cancelacion: new Date().toISOString(),
        razon: eventData.razon_fallo || 'Fallo en delivery',
        intentos_realizados: eventData.intentos_realizados || 1,
        stock_recuperado: true,
        timestamp: getTimestamp()
      }
    });

    console.log('Orden cancelada y stock recuperado exitosamente:', eventData.orden_id);
    return true;

  } catch (error) {
    console.error('Error procesando delivery.failed:', error);
    return false;
  }
}

module.exports = {
  handle
}; 