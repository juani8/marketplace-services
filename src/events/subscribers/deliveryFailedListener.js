const deliveryFailedHandler = require('../handlers/deliveryFailedHandler');

/**
 * Procesa los eventos de delivery.failed recibidos
 * @param {Object} event - Evento recibido del hub
 */
async function processEvent(event) {
  try {
    // Validar que el evento tenga la estructura esperada
    if (!event || !event.payload || !event.payload.orden_id) {
      console.error('Evento delivery.failed inválido:', event);
      return false;
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
    WHERE orden_id = [orden_id];

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
    console.error('Error procesando evento delivery.failed:', error);
    return false;
  }
}

// Configuración del subscriber
const subscriber = {
  topic: 'delivery.failed',
  processEvent
};

module.exports = subscriber; 