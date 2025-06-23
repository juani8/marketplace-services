const ivaPedidoHandler = require('../handlers/ivaPedidoHandler');

/**
 * Procesa los eventos de iva.pedido recibidos
 * @param {Object} event - Evento recibido del hub
 */
async function processEvent(event) {
  try {
    console.log('Procesando evento iva.pedido:', JSON.stringify(event, null, 2));

    // Si el evento viene directamente con id, lo procesamos
    if (event && event.id) {
      console.log('Procesando evento con estructura simple');
      const result = await ivaPedidoHandler.handle(event);
      return result;
    }

    // Si el evento viene con la estructura topic/payload
    if (event && event.topic && event.payload) {
      console.log('Procesando evento con estructura topic/payload');
      if (event.topic !== 'iva.pedido') {
        console.error('Topic incorrecto:', event.topic);
        return false;
      }
      const result = await ivaPedidoHandler.handle(event.payload);
      return result;
    }

    // Si no cumple ninguna estructura válida
    console.error('Estructura de evento inválida:', event);
    return false;
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
