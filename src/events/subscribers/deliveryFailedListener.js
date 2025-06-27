const deliveryFailedHandler = require('../handlers/deliveryFailedHandler');

/**
 * Procesa los eventos de pedido.cancelado recibidos
 * @param {Object} event - Evento recibido del hub con formato { topic: 'pedido.cancelado', payload: { pedidoId, estado } }
 */
async function processEvent(event) {
  try {
    // Validar que el evento tenga la estructura esperada
    if (!event || !event.payload || !event.payload.pedidoId || !event.payload.estado) {
      console.error('Evento pedido.cancelado inválido:', event);
      return false;
    }

    // Validar que el estado sea 'CANCELADO' o 'cancelado'
    const estadoNormalizado = event.payload.estado.toUpperCase();
    if (estadoNormalizado !== 'CANCELADO') {
      console.log(`Evento pedido.cancelado recibido con estado ${event.payload.estado}, ignorando.`);
      return true; // No es error, simplemente no procesamos
    }

    /*
    Lógica necesaria en la base de datos:
    1. Actualizar la orden en la tabla ordenes:
       - Cambiar estado a 'cancelada' (delivery falló según el modelo)
       - Actualizar fecha_actualizacion con CURRENT_TIMESTAMP
    
    2. Recuperar el stock:
       - Cuando una orden se cancela por fallo en delivery, 
         se debe recuperar el stock que estaba reservado
       - Esto implica actualizar la tabla de stock de productos
         sumando nuevamente las cantidades que estaban en la orden

    Ejemplo SQL para la orden:
    UPDATE ordenes 
    SET estado = 'cancelada',
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE orden_id = [pedidoId];

    Importante: 
    - La orden podría estar en estado 'listo' cuando falla el delivery
    - Según el modelo, 'cancelada' implica "delivery falló, recupero stock"
    - Se debe implementar la lógica de recuperación de stock en una transacción
      para asegurar consistencia
    */

    // Procesar el evento usando el handler
    const result = await deliveryFailedHandler.handle(event.payload);
    return result;

  } catch (error) {
    console.error('Error procesando evento pedido.cancelado:', error);
    return false;
  }
}

// Configuración del subscriber
const subscriber = {
  topic: 'pedido.cancelado',
  processEvent
};

module.exports = subscriber; 