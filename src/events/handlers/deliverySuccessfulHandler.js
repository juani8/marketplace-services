const { getTimestamp } = require('../utils/getTimestamp');
const OrderModel = require('../../models/order.model');

/**
 * Maneja el evento pedido.entregado y actualiza el estado de la orden
 * @param {Object} eventData - Datos del evento recibido { pedidoId: 'ORD_PHU998', estado: 'ENTREGADO' }
 */
async function handle(eventData) {
  try {
    const { pedidoId, estado } = eventData;

    // Validar que tenemos los datos requeridos
    if (!pedidoId || !estado) {
      throw new Error('Datos del evento inválidos: se requiere pedidoId y estado');
    }

    // Validar que el estado sea 'ENTREGADO'
    if (estado !== 'ENTREGADO') {
      throw new Error(`Estado inválido: ${estado}. Se esperaba 'ENTREGADO'`);
    }

    // Obtener la orden y validar que exista
    const orden = await OrderModel.getById(pedidoId);
    if (!orden) {
      throw new Error(`Orden ${pedidoId} no encontrada`);
    }
    
    // Validar que la orden esté en estado 'listo'
    if (orden.estado !== 'listo') {
      throw new Error(`Orden ${pedidoId} en estado inválido: ${orden.estado}. Se esperaba 'listo'`);
    }

    // Actualizar estado de la orden a 'finalizada'
    await OrderModel.updateStatus(pedidoId, 'finalizada');

    console.log(`Orden ${pedidoId} marcada como finalizada exitosamente`);
    return true;
  } catch (error) {
    console.error('Error procesando pedido.entregado:', error);
    return false;
  }
}

module.exports = {
  handle
}; 