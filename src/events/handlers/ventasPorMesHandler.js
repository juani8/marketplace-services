const { publishTotalOrdenes } = require('../publishers/ordenesPublisher');

/**
 * Maneja el evento ventas.por_mes y responde con el total de órdenes
 * @param {Object} eventData - Datos del evento recibido
 */
async function handle(eventData) {
  try {
    const { tenant_id, fecha_desde, fecha_hasta } = eventData;

    // TODO: Aquí iría la lógica para obtener las órdenes de la base de datos
    // y calcular los totales para el período especificado
    const totales = {
      tenant_id,
      fecha_desde,
      fecha_hasta,
      cantidad_ordenes: 0, // Obtener de DB
      monto_total: 0.0,    // Obtener de DB
      promedio_por_orden: 0.0 // Calcular basado en los valores anteriores
    };

    // Publicar respuesta con los totales
    await publishTotalOrdenes(totales);

    return true;
  } catch (error) {
    console.error('Error procesando ventas.por_mes:', error);
    return false;
  }
}

module.exports = {
  handle
};
