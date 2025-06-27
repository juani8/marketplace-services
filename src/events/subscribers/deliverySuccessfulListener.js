const deliverySuccessfulHandler = require('../handlers/deliverySuccessfulHandler');

/**
 * Procesa los eventos de pedido.entregado recibidos
 * @param {Object} event - Evento recibido del hub con formato { topic: 'pedido.entregado', payload: { pedidoId, estado } }
 */
async function processEvent(event) {
  try {
    // Validar que el evento tenga la estructura esperada
    if (!event || !event.payload || !event.payload.pedidoId || !event.payload.estado) {
      console.error('Evento pedido.entregado inválido:', event);
      return false;
    }

    // Validar que el estado sea 'ENTREGADO'
    if (event.payload.estado !== 'ENTREGADO') {
      console.log(`Evento pedido.entregado recibido con estado ${event.payload.estado}, ignorando.`);
      return true; // No es error, simplemente no procesamos
    }

    /*
    Lógica necesaria en la base de datos:
    1. Actualizar la orden en la tabla ordenes:
       - Cambiar estado a 'finalizada' (entregado según el modelo)
       - Actualizar fecha_actualizacion con CURRENT_TIMESTAMP
    
    Ejemplo SQL:
    UPDATE ordenes 
    SET estado = 'finalizada',
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE orden_id = [pedidoId];

    Importante: La orden debería estar en estado 'listo' antes de pasar a 'finalizada'
    ya que según el modelo los estados son:
    - pendiente (recibido de cliente)
    - aceptada (validado y stock reservado)
    - rechazada (no hay stock)
    - cancelada (delivery falló, recupero stock)
    - listo (pedido preparado)
    - finalizada (entregado)
    */

    // Procesar el evento usando el handler
    const result = await deliverySuccessfulHandler.handle(event.payload);
    return result;

  } catch (error) {
    console.error('Error procesando evento pedido.entregado:', error);
    return false;
  }
}

// Configuración del subscriber
const subscriber = {
  topic: 'pedido.entregado',
  processEvent
};

module.exports = subscriber; 