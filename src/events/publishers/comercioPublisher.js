const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica el evento comercio.crear cuando se crea un nuevo comercio
 * @param {Object} comercio - El comercio creado
 */
async function publishComercioCreated(comercio) {
  const eventPayload = {
    timestamp: getTimestamp(),
    comercio: {
      comercio_id: comercio.comercio_id,
      tenant_id: comercio.tenant_id,
      nombre: comercio.nombre,
      lat: comercio.lat,
      lon: comercio.lon,
      calle: comercio.calle,
      numero: comercio.numero,
      ciudad: comercio.ciudad,
      provincia: comercio.provincia,
      codigo_postal: comercio.codigo_postal
    }
  };

  await publishEvent('comercio.creado', eventPayload);
}

/**
 * Publica el evento comercio.actualizado cuando se actualiza un comercio
 * @param {Object} comercio - El comercio actualizado
 * @param {Object} cambios - Los campos que fueron actualizados
 */
async function publishComercioUpdated(comercio, cambios) {
  const eventPayload = {
    timestamp: getTimestamp(),
    comercio_id: comercio.comercio_id,
    tenant_id: comercio.tenant_id,
    cambios: cambios
  };

  await publishEvent('comercio.actualizado', eventPayload);
}

module.exports = {
  publishComercioCreated,
  publishComercioUpdated
};
