const ventasPorMesHandler = require('../handlers/ventasPorMesHandler');

/**
 * Procesa los eventos de ventas.por_mes recibidos
 * @param {Object} event - Evento recibido del hub
 */
async function processEvent(event) {
  try {
    // Validar que el evento tenga la estructura esperada
    if (!event || !event.payload || !event.payload.tenant_id || 
        !event.payload.fecha_desde || !event.payload.fecha_hasta) {
      console.error('Evento ventas.por_mes inválido:', event);
      return false;
    }

    // Procesar el evento usando el handler
    const result = await ventasPorMesHandler.handle(event.payload);
    return result;

  } catch (error) {
    console.error('Error procesando evento ventas.por_mes:', error);
    return false;
  }
}

// Configuración del subscriber
const subscriber = {
  topic: 'ventas.por_mes',
  processEvent
};

module.exports = subscriber;
