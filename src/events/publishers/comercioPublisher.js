const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica el evento comercio.crear cuando se crea un nuevo comercio
 * @param {Object} comercio - El comercio creado
 */
async function publishComercioCreated(comercio) {
  const payload = {
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
async function publishComercioUpdated(comercio, cambios) {
  const payload = {
    comercio_id: comercio.comercio_id,
    tenant_id: comercio.tenant_id,
    cambios: cambios,
    timestamp: getTimestamp()
  };

  await publishEvent('comercio.actualizado', payload);
}

module.exports = {
  publishComercioCreated,
  publishComercioUpdated
};
