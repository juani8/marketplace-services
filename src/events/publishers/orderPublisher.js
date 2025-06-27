const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica la confirmación de un pedido creado
 * @param {Object} orderData - Datos del pedido a confirmar
 */
async function publishOrderConfirmation(orderData) {
  const payload = {
    pedidoId: orderData.pedidoId,
    comercio_id: orderData.comercio_id,
    cliente_nombre: orderData.cliente_nombre,
    direccion_entrega: orderData.direccion_entrega,
    productos: orderData.productos
  };

  return await publishEvent('pedido.confirmar', payload);
}

/**
 * Publica la respuesta con los totales de órdenes por tenant
 * @param {Object} data - Datos de totales por tenant
 */
async function publishTotalsByTenant(data) {
  const event = {
    topic: 'ordenesbytenant.respuesta',
    payload: {
      tenant_id: data.tenant_id,
      totales: {
        cantidad_ordenes: data.cantidad_ordenes,
        monto_total: data.monto_total,
        promedio_por_orden: data.promedio_por_orden
      },
      timestamp: getTimestamp()
    }
  };

  return await publishEvent(event);
}

module.exports = {
  publishOrderConfirmation,
  publishTotalsByTenant
}; 