const { publishIvaResponse } = require('../publishers/ivaPublisher');

/**
 * Maneja el evento iva.pedido y responde con el cálculo de IVA
 * @param {Object} eventData - Datos del evento recibido
 */
async function handle(eventData) {
  try {
    const { pedidos } = eventData;

    // Procesar cada pedido y desglosar IVA
    const pedidosConIva = pedidos.map(pedido => {
      const total = parseFloat(pedido.total); // Usamos pedido.total que es el monto con IVA incluido
      const subtotal = total / 1.21; // Como el total incluye IVA (21%), dividimos por 1.21
      const montoIva = total - subtotal; // El IVA es la diferencia entre total y subtotal
      
      return {
        pedido_id: pedido.pedido_id,
        fecha: pedido.fecha,
        subtotal: Number(subtotal.toFixed(2)), // Redondeamos a 2 decimales
        montoIva: Number(montoIva.toFixed(2)),
        total: total
      };
    });

    // Publicar respuesta con los cálculos
    await publishIvaResponse(pedidosConIva);

    return true;
  } catch (error) {
    console.error('Error procesando iva.pedido:', error);
    return false;
  }
}

module.exports = {
  handle
};
