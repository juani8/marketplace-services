const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica el evento tenant.crear cuando se crea un nuevo tenant
 * @param {Object} tenant - El tenant creado
 */
async function publishTenantCreated(tenant) {
  const payload = {
    tenant_id: tenant.tenant_id,
    nombre: tenant.nombre,
    razon_social: tenant.razon_social,
    cuenta_bancaria: tenant.cuenta_bancaria,
    email: tenant.email,
    telefono: tenant.telefono,
    direccion_fiscal: {
      calle: tenant.calle,
      numero: tenant.numero,
      ciudad: tenant.ciudad,
      provincia: tenant.provincia,
      codigo_postal: tenant.codigo_postal,
      lat: tenant.lat,
      lon: tenant.lon
    },
    sitio_web: tenant.sitio_web,
    instagram: tenant.instagram,
    estado: tenant.estado,
    fecha_registro: tenant.fecha_registro,
    fecha_actualizacion: tenant.fecha_actualizacion,
    timestamp: getTimestamp()
  };

  await publishEvent('tenant.creado', payload);
}

/**
 * Publica el evento tenant.actualizado cuando se actualiza un tenant
 * @param {Object} tenant - El tenant actualizado
 * @param {Object} cambios - Los campos que fueron actualizados
 */
async function publishTenantUpdated(tenant, cambios) {
  // Restructure cambios if it contains ubicacion fields
  const ubicacionFields = ['calle', 'numero', 'ciudad', 'provincia', 'codigo_postal', 'sitio_web', 'instagram', 'lat', 'lon'];
  const ubicacionChanges = {};
  const otherChanges = {};

  for (const [key, value] of Object.entries(cambios)) {
    if (ubicacionFields.includes(key)) {
      ubicacionChanges[key] = value;
    } else {
      otherChanges[key] = value;
    }
  }

  // Only include ubicacion in changes if there are ubicacion changes
  if (Object.keys(ubicacionChanges).length > 0) {
    otherChanges.ubicacion = ubicacionChanges;
  }

  const payload = {
    tenant_id: tenant.tenant_id,
    cambios: otherChanges,
    timestamp: getTimestamp()
  };

  await publishEvent('tenant.actualizado', payload);
}

/**
 * Publica el evento tenant.eliminado cuando se elimina un tenant
 * @param {string} tenantId - ID del tenant eliminado
 * @param {string} nombre - Nombre del tenant eliminado
 */
async function publishTenantDeleted(tenantId, nombre) {
  const payload = {
    tenant_id: tenantId,
    nombre: nombre,
    timestamp: getTimestamp()
  };

  await publishEvent('tenant.eliminado', payload);
}

module.exports = {
  publishTenantCreated,
  publishTenantUpdated,
  publishTenantDeleted
};
