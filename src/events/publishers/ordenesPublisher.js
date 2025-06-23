const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica el evento ordenes.total con el total de órdenes por tenant
 * @param {Object} data - Datos de totales por tenant
 */
async function publishTotalOrdenes(data) {
  const eventPayload = {
    timestamp: getTimestamp(),
    tenant_id: data.tenant_id,
    periodo: {
      desde: data.fecha_desde,
      hasta: data.fecha_hasta
    },
    totales: {
      cantidad_ordenes: data.cantidad_ordenes,
      monto_total: data.monto_total,
      promedio_por_orden: data.promedio_por_orden
    }
  };

  await publishEvent('ordenes.total', eventPayload);
}

module.exports = {
  publishTotalOrdenes
}; 