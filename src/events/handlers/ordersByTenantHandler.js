const { publishTotalsByTenant } = require('../publishers/orderPublisher');
const OrderModel = require('../../models/order.model');

/**
 * Maneja el evento ordenesbytenant.pedido y responde con el total de órdenes
 * @param {Object} event - Evento recibido
 */
async function handle(event) {
  try {
    // Validar que el evento tenga la estructura esperada
    if (!event || !event.topic || !event.payload || !event.payload.tenant_id) {
      console.error('Evento ordenesbytenant.pedido inválido:', event);
      return false;
    }

    const { tenant_id } = event.payload;

    // Obtener totales de la base de datos
    const totales = await OrderModel.getTotalsByTenant(tenant_id);

    // Formatear datos para la respuesta
    const responseData = {
      tenant_id,
      cantidad_ordenes: parseInt(totales.cantidad_ordenes),
      monto_total: parseFloat(totales.monto_total),
      promedio_por_orden: parseFloat(totales.promedio_por_orden)
    };

    // Publicar respuesta con los totales
    await publishTotalsByTenant(responseData);

    return true;
  } catch (error) {
    console.error('Error procesando ordenesbytenant.pedido:', error);
    return false;
  }
}

module.exports = {
  handle
}; 