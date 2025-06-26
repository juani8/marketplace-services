const { getTimestamp } = require('../utils/getTimestamp');
const { publishEvent } = require('../utils/publishEvent');
// TODO: Importar el modelo de órdenes cuando esté creado
// const OrdenModel = require('../../models/orden.model');

/**
 * Maneja el evento delivery.successful y actualiza el estado de la orden
 * @param {Object} eventData - Datos del evento recibido
 */
async function handle(eventData) {
  try {
    // TODO: Obtener la orden y validar que exista
    // const orden = await OrdenModel.getById(eventData.orden_id);
    // if (!orden) {
    //   throw new Error(`Orden ${eventData.orden_id} no encontrada`);
    // }
    
    // TODO: Validar que la orden esté en estado 'listo'
    // if (orden.estado !== 'listo') {
    //   throw new Error(`Orden ${eventData.orden_id} en estado inválido: ${orden.estado}`);
    // }

    // TODO: Actualizar estado de la orden a 'finalizada'
    // await OrdenModel.updateStatus(eventData.orden_id, 'finalizada');
    
    // Publicar evento de orden finalizada
    await publishEvent({
      topic: 'orden.finalizada',
      payload: {
        orden_id: eventData.orden_id,
        tenant_id: eventData.tenant_id,
        comercio_id: eventData.seller_id,
        fecha_entrega: eventData.fecha_entrega,
        items: eventData.items,
        total: eventData.total_monto,
        timestamp: getTimestamp()
      }
    });

    return true;
  } catch (error) {
    console.error('Error procesando delivery.successful:', error);
    return false;
  }
}

module.exports = {
  handle
}; 