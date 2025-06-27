const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica el evento stock.actualizado cuando cambia el stock de un producto
 * @param {Object} stockData - Datos del stock actualizado
 */
async function publishStockUpdated(stockData) {
  const payload = {
    comercio: {
      comercio_id: stockData.comercio_id,
      nombre: stockData.comercio_nombre,
      tenant_id: stockData.tenant_id,
      tenant_nombre: stockData.tenant_nombre
    },
    producto: {
      producto_id: stockData.producto_id,
      nombre_producto: stockData.nombre_producto,
      descripcion: stockData.descripcion,
      precio: stockData.precio,
      categoria_id: stockData.categoria_id,
      categoria_nombre: stockData.categoria_nombre
    },
    stock: {
      cantidad_anterior: stockData.cantidad_anterior,
      cantidad_nueva: stockData.cantidad_nueva
    },
    timestamp: getTimestamp()
  };

  await publishEvent('stock.actualizado', payload);
}

module.exports = {
  publishStockUpdated
}; 