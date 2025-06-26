const ivaPedidoHandler = require('../handlers/ivaOrderHandler');

/**
 * Procesa los eventos de iva.pedido recibidos
 * @param {Object} event - Evento recibido del hub
 */
async function processEvent(event) {
  try {
    console.log('Procesando evento iva.pedido:', JSON.stringify(event, null, 2));

    // Validar que el evento tenga la estructura esperada
    if (!event || !event.topic || !event.payload || !event.payload.fechaDesde || !event.payload.fechaHasta) {
      console.error('Evento iva.pedido inválido:', event);
      return false;
    }

    // Verificar que el topic sea el correcto
    if (event.topic !== 'iva.pedido') {
      console.error('Topic incorrecto:', event.topic);
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
