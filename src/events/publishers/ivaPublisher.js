const publishEvent = require('../utils/publishEvent');

/**
 * Publica el evento iva.respuesta con el cálculo de IVA para los pedidos
 * @param {Array} pedidos - Lista de pedidos con sus montos
 */
async function publishIvaResponse(pedidos) {
  const payload = {
    pedidos: pedidos.map(pedido => ({
      pedidoId: pedido.pedidoId,
      fecha: pedido.fecha,
      subtotal: pedido.subtotal,
      montoIva: pedido.montoIva,
      total: pedido.total
    }))
  };

  return await publishEvent('iva.respuesta', payload);
}

module.exports = {
  publishIvaResponse
}; 