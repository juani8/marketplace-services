const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica el evento producto.actualizado cuando se actualiza un producto
 * @param {Object} productData - Datos del producto actualizado con información completa
 */
async function publishProductUpdated(productData) {
  const payload = {
    tenant_id: productData.tenant_id,
    producto: {
      producto_id: productData.producto_id,
      nombre_producto: productData.nombre_producto,
      descripcion: productData.descripcion,
      precio: productData.precio,
      categoria: {
        categoria_id: productData.categoria_id,
        nombre_categoria: productData.nombre_categoria
      },
      promociones: productData.promociones || [],
      estado: productData.estado
    },
    campos_cambiados: productData.campos_cambiados,
    timestamp: getTimestamp()
  };

  await publishEvent('producto.actualizado', payload);
}

module.exports = {
  publishProductUpdated
}; 