const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica el evento tenant.crear cuando se crea un nuevo tenant
 * @param {Object} tenant - El tenant creado
 */
async function publishTenantCreated(tenant) {
  const eventPayload = {
    timestamp: getTimestamp(),
    tenant: {
      tenant_id: tenant.tenant_id,
      nombre: tenant.nombre,
      razon_social: tenant.razon_social,
      ubicacion: {
        calle: tenant.calle,
        numero: tenant.numero,
        ciudad: tenant.ciudad,
        provincia: tenant.provincia,
        codigo_postal: tenant.codigo_postal,
        lat: tenant.lat,
        lon: tenant.lon
      },
      cuenta_bancaria: tenant.cuenta_bancaria,
      estado: tenant.estado
    }
  };

  await publishEvent('tenant.crear', eventPayload);
}

/**
 * Publica el evento tenant.actualizado cuando se actualiza un tenant
 * @param {Object} tenant - El tenant actualizado
 * @param {Object} cambios - Los campos que fueron actualizados
 */
async function publishTenantUpdated(tenant, cambios) {
  const eventPayload = {
    timestamp: getTimestamp(),
    tenant_id: tenant.tenant_id,
    cambios: cambios
  };

  await publishEvent('tenant.actualizado', eventPayload);
}

/**
 * Publica el evento tenant.eliminado cuando se elimina un tenant
 * @param {string} tenantId - ID del tenant eliminado
 * @param {string} nombre - Nombre del tenant eliminado
 */
async function publishTenantDeleted(tenantId, nombre) {
  const eventPayload = {
    timestamp: getTimestamp(),
    tenant_id: tenantId,
    nombre: nombre
  };

  await publishEvent('tenant.eliminado', eventPayload);
}

module.exports = {
  publishTenantCreated,
  publishTenantUpdated,
  publishTenantDeleted
};
