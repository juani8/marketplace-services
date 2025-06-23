const TenantModel = require('../models/tenant.model');
const { publishEvent } = require('../events/utils/publishEvent');
const { geocodeAddress } = require('../services/geocodingService');



async function getAllTenants(req, res) {
  try {
    let { page = 1, size = 10 } = req.query;

    page = parseInt(page);
    size = parseInt(size);

    // Validaciones para evitar 0 o negativos
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(size) || size < 1) size = 10;

    const { data, totalItems } = await TenantModel.getAll(page, size);

    const totalPages = Math.ceil(totalItems / size);

    res.json({
      data,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Error getting tenants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function createTenant(req, res) {
  try {
    const { 
      nombre, 
      razon_social, 
      cuenta_bancaria, 
      calle,
      numero,
      ciudad,
      provincia,
      codigo_postal,
      horario_apertura,
      horario_cierre, 
    } = req.body;

    if (!nombre || !razon_social || !calle || !numero || !ciudad || !provincia) {
      return res.status(400).json({ 
        message: 'Nombre, razón social y dirección completa (calle, numero, ciudad, provincia) son obligatorios.' 
      });
    }

    // Geocodificamos la dirección
    let lat, lon;
    try {
      const location = await geocodeAddress({
        calle,
        numero,
        ciudad,
        provincia,
        codigo_postal
      });
      lat = location.lat;
      lon = location.lon;
    } catch (geoError) {
      return res.status(400).json({ 
        message: 'Dirección inválida o no encontrada. Por favor verifica los datos ingresados.' 
      });
    }

    const newTenant = await TenantModel.create({
      nombre,
      razon_social,
      cuenta_bancaria,
      calle,
      numero,
      ciudad,
      provincia,
      codigo_postal,
      lat,
      lon,
      horario_apertura,
      horario_cierre,
      estado: 'activo'
    });

    res.status(201).json(newTenant);

    await publishEvent('alta_tenant_iniciada', {
      tenant_id: newTenant.tenant_id,
      nombre: newTenant.nombre
    });

  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


async function patchTenant(req, res) {
  try {
    const { tenantId } = req.params;
    let updateFields = req.body;

    if (!updateFields || Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No se enviaron campos para actualizar.' });
    }

    // Buscar el tenant
    const existingTenant = await TenantModel.getById(tenantId);
    if (!existingTenant) {
      return res.status(404).json({ message: 'Tenant no encontrado.' });
    }

    // Si se actualiza algún campo de dirección, necesitamos todos los campos para geocodificar
    if (updateFields.calle || updateFields.numero || updateFields.ciudad || updateFields.provincia || updateFields.codigo_postal) {
      const direccion = {
        calle: updateFields.calle || existingTenant.calle,
        numero: updateFields.numero || existingTenant.numero,
        ciudad: updateFields.ciudad || existingTenant.ciudad,
        provincia: updateFields.provincia || existingTenant.provincia,
        codigo_postal: updateFields.codigo_postal || existingTenant.codigo_postal
      };

      const { lat, lon } = await geocodeAddress(direccion);
      updateFields = {
        ...updateFields,
        lat,
        lon
      };
    }

    // Actualizar el tenant solo con los campos enviados
    const updatedTenant = await TenantModel.patch(tenantId, updateFields);

    await publishEvent('modificacion_tenant', {
      tenant_id: updatedTenant.tenant_id,
      nombre: updatedTenant.nombre
    });

    res.json(updatedTenant);
  } catch (error) {
    console.error('Error actualizando parcialmente tenant:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}



async function deleteTenant(req, res) {
  try {
    const { tenantId } = req.params;

    // Buscar el tenant primero
    const existingTenant = await TenantModel.getById(tenantId);
    if (!existingTenant) {
      return res.status(404).json({ message: 'Tenant no encontrado.' });
    }

    // Eliminar
    await TenantModel.delete(tenantId);

    // Publicar evento de baja
    await publishEvent('baja_tenant_iniciada', {
      tenant_id: tenantId,
      nombre: existingTenant.nombre
    });

    // Responder con 204 No Content
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando tenant:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

module.exports = { getAllTenants, createTenant, patchTenant, deleteTenant };