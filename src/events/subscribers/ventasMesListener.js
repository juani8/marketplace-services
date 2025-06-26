const ventasMesHandler = require('../handlers/ventasMesHandler');

/**
 * Procesa los eventos de ventas.mes recibidos
 * @param {Object} event - Evento recibido del hub
 */
async function processEvent(event) {
  try {
    console.log('Procesando evento ventas.mes:', JSON.stringify(event, null, 2));

    // Validar que el evento tenga la estructura esperada
    if (!event || !event.topic || !event.payload || !event.payload.fechaDesde || !event.payload.fechaHasta) {
      console.error('Evento ventas.mes inválido:', event);
      return false;
    }

    // Verificar que el topic sea el correcto
    if (event.topic !== 'ventas.mes') {
      console.error('Topic incorrecto:', event.topic);
      return false;
    }

    // Procesar el evento usando el handler
    const result = await ventasMesHandler.handle(event.payload);
    return result;

  } catch (error) {
    console.error('Error procesando evento ventas.mes:', error);
    return false;
  }
}

// Configuración del subscriber
const subscriber = {
  topic: 'ventas.mes',
  processEvent
};

module.exports = subscriber; 