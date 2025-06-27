const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica el evento venta.mes.respuesta con las ventas del período
 * @param {Array} ventas - Lista de ventas por tenant
 */
async function publishVentasMesResponse(ventas) {
  const payload = {
    ventas: ventas,
    timestamp: getTimestamp()
  };

  return await publishEvent('venta.mes.respuesta', payload);
}

module.exports = {
  publishVentasMesResponse
}; 