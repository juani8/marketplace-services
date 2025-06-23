const publishEvent = require('../utils/publishEvent');

/**
 * Publica el evento iva.respuesta con el cálculo de IVA para los pedidos
 * @param {Array} pedidos - Lista de pedidos con sus montos
 */
async function publishIvaResponse(pedidos) {
  console.log('Preparando respuesta IVA para pedidos:', pedidos);

  const eventPayload = {
    pedidos: pedidos.map(pedido => ({
      pedido_id: pedido.pedido_id,
      fecha: pedido.fecha,
      subtotal: pedido.subtotal,
      montoIva: pedido.montoIva,
      total: pedido.total
    }))
  };

  console.log('Enviando respuesta IVA:', eventPayload);
  const result = await publishEvent('iva.respuesta', eventPayload);
  console.log('Resultado del envío de respuesta IVA:', result);
  return result;
}

module.exports = {
  publishIvaResponse
}; 