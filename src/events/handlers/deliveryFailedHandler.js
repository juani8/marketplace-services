const { getTimestamp } = require('../utils/getTimestamp');
const OrderModel = require('../../models/order.model');

/**
 * Maneja el evento pedido.cancelado y actualiza el estado de la orden
 * @param {Object} eventData - Datos del evento recibido { pedidoId: 'ORD_PHU998', estado: 'CANCELADO' }
 */
async function handle(eventData) {
  try {
    const { pedidoId, estado } = eventData;

    // Validar que tenemos los datos requeridos
    if (!pedidoId || !estado) {
      throw new Error('Datos del evento inválidos: se requiere pedidoId y estado');
    }

    // Validar que el estado sea 'CANCELADO' o 'cancelado'
    const estadoNormalizado = estado.toUpperCase();
    if (estadoNormalizado !== 'CANCELADO') {
      throw new Error(`Estado inválido: ${estado}. Se esperaba 'CANCELADO' o 'cancelado'`);
    }

    console.log('Procesando pedido.cancelado para orden:', pedidoId);

    // Recuperar stock de la orden cancelada
    // El método recoverStock ya maneja:
    // 1. Verificar que la orden existe
    // 2. Validar estados válidos para cancelar
    // 3. Recuperar el stock de todos los productos
    // 4. Actualizar el estado a 'cancelada'
    // 5. Publicar eventos de stock actualizado
    const stockRecuperado = await OrderModel.recoverStock(pedidoId);
    
    if (!stockRecuperado) {
      throw new Error(`No se pudo recuperar el stock para la orden ${pedidoId}`);
    }

    await OrderModel.updateStatus(pedidoId, 'cancelada');

    console.log(`Orden ${pedidoId} actualizada a estado 'cancelada'`);
    
    console.log('Orden cancelada y stock recuperado exitosamente:', pedidoId);
    return true;

  } catch (error) {
    console.error('Error procesando pedido.cancelado:', error);
    return false;
  }
}

module.exports = {
  handle
}; 