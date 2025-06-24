const ordersByTenantHandler = require('../handlers/ordersByTenantHandler');

/**
 * Procesa los eventos de ordenesbytenant.pedido recibidos
 * @param {Object} event - Evento recibido del hub
 */
async function processEvent(event) {
  try {
    console.log('Procesando evento ordenesbytenant.pedido:', JSON.stringify(event, null, 2));
    return await ordersByTenantHandler.handle(event);
  } catch (error) {
    console.error('Error procesando evento ordenesbytenant.pedido:', error);
    return false;
  }
}

// Configuración del subscriber
const subscriber = {
  topic: 'ordenesbytenant.pedido',
  processEvent
};

module.exports = subscriber; 