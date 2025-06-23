const ivaPedidoHandler = require('../handlers/ivaPedidoHandler');

/**
 * Procesa los eventos de iva.pedido recibidos
 * @param {Object} event - Evento recibido del hub
 */
async function processEvent(event) {
  try {
    // Validar que el evento tenga la estructura esperada
    if (!event || !event.payload || !event.payload.orden_id) {
      console.error('Evento iva.pedido inválido:', event);
      return false;
    }

    // Procesar el evento usando el handler
    const result = await ivaPedidoHandler.handle(event.payload);
    return result;

  } catch (error) {
    console.error('Error procesando evento iva.pedido:', error);
    return false;
  }
}

// Configuración del subscriber
const subscriber = {
  topic: 'iva.pedido',
  processEvent
};

module.exports = subscriber;
