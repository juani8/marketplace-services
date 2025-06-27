const orderCreatedHandler = require('../handlers/orderCreatedHandler');

/**
 * Procesa los eventos de pedido.creado recibidos
 * @param {Object} event - Evento recibido del hub
 */
async function processEvent(event) {
  try {
    console.log('\nEVENTO ENTRANTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Tópico: pedido.creado');
    console.log('Datos:', JSON.stringify(event.payload, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const result = await orderCreatedHandler.handle(event);
    
    console.log('\nRESPUESTA DEL MANEJADOR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Éxito:', result);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return result;
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