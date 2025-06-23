const publishEvent = require('../utils/publishEvent');

/**
 * Publica el evento iva.respuesta con el cálculo de IVA para los pedidos
 * @param {Array} pedidos - Lista de pedidos con sus montos
 */
async function publishIvaResponse(pedidos) {
  const eventPayload = {
    pedidos: pedidos.map(pedido => ({
      pedidoId: pedido.pedido_id,
      fecha: pedido.fecha,
      subtotal: pedido.subtotal,
      montoIva: pedido.monto_iva,
      total: pedido.total
    }))
  };

  await publishEvent('iva.respuesta', eventPayload);
}

module.exports = {
  publishIvaResponse
}; 