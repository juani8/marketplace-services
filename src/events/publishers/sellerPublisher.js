const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica el evento comercio.crear cuando se crea un nuevo comercio
 * @param {Object} comercio - El comercio creado
 */
async function publishSellerCreated(seller) {
  const payload = {
    comercio: {
      comercio_id: seller.comercio_id,
      tenant_id: seller.tenant_id,
      nombre: seller.nombre,
      lat: seller.lat,
      lon: seller.lon,
      calle: seller.calle,
      numero: seller.numero,
      ciudad: seller.ciudad,
      provincia: seller.provincia,
      codigo_postal: seller.codigo_postal
    },
    timestamp: getTimestamp()
  };

  await publishEvent('comercio.creado', payload);
}

/**
 * Publica el evento comercio.actualizado cuando se actualiza un comercio
 * @param {Object} comercio - El comercio actualizado
 * @param {Object} cambios - Los campos que fueron actualizados
 */
async function publishSellerUpdated(seller, cambios) {
  const payload = {
    seller_id: seller.seller_id,
    tenant_id: seller.tenant_id,
    cambios: cambios,
    timestamp: getTimestamp()
  };

  await publishEvent('comercio.actualizado', payload);
}

module.exports = {
  publishSellerCreated,
  publishSellerUpdated
};
