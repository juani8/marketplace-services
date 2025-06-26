const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica el evento venta.mes.respuesta con las ventas del período
 * @param {Array} ventas - Lista de ventas por tenant
 */
async function publishVentasMesResponse(ventas) {
  const payload = {
    topic: 'venta.mes.respuesta',
    payload: {
      ventas: ventas,
      timestamp: getTimestamp()
    }
  };

  return await publishEvent(payload);
}

module.exports = {
  publishVentasMesResponse
}; 