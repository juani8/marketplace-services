const orderCreatedHandler = require('../handlers/orderCreatedHandler');

/**
 * Procesa los eventos de pedido.creado recibidos
 * @param {Object} event - Evento recibido del hub
 */
async function processEvent(event) {
  try {
    console.log('Procesando evento pedido.creado:', JSON.stringify(event, null, 2));
    return await orderCreatedHandler.handle(event);
  } catch (error) {
    console.error('Error procesando evento pedido.creado:', error);
    return false;
  }
}

// Configuración del subscriber
const subscriber = {
  topic: 'pedido.creado',
  processEvent
};

module.exports = subscriber; 