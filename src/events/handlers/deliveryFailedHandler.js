const { getTimestamp } = require('../utils/getTimestamp');
const { publishEvent } = require('../utils/publishEvent');
// TODO: Importar los modelos cuando estén creados
// const OrdenModel = require('../../models/orden.model');
// const ProductoStockModel = require('../../models/producto_stock.model');

/**
 * Maneja el evento delivery.failed y actualiza el estado de la orden
 * @param {Object} eventData - Datos del evento recibido
 */
async function handle(eventData) {
  try {
    // TODO: Obtener la orden con sus items
    // const orden = await OrdenModel.getByIdWithItems(eventData.orden_id);
    // if (!orden) {
    //   throw new Error(`Orden ${eventData.orden_id} no encontrada`);
    // }

    // TODO: Validar que la orden esté en estado válido para cancelar
    // if (!['listo', 'aceptada'].includes(orden.estado)) {
    //   throw new Error(`Orden ${eventData.orden_id} en estado inválido: ${orden.estado}`);
    // }

    // TODO: Recuperar stock para cada item
    // for (const item of orden.items) {
    //   await ProductoStockModel.incrementStock(
    //     item.producto_id,
    //     eventData.seller_id,
    //     item.cantidad
    //   );
    // }

    // TODO: Actualizar estado de la orden a 'cancelada'
    // await OrdenModel.updateStatus(eventData.orden_id, 'cancelada');
    
    // Publicar evento de orden cancelada
    await publishEvent({
      topic: 'orden.cancelada',
      payload: {
        orden_id: eventData.orden_id,
        tenant_id: eventData.tenant_id,
        comercio_id: eventData.seller_id,
        fecha_cancelacion: eventData.fecha_intento,
        razon: eventData.razon,
        estado_anterior: 'listo', // TODO: Usar el estado real de la orden
        timestamp: getTimestamp()
      }
    });

    return true;
  } catch (error) {
    console.error('Error procesando delivery.failed:', error);
    return false;
  }
}

module.exports = {
  handle
}; 