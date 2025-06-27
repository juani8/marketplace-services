const TenantModel = require('../models/tenant.model');
const { geocodeAddress } = require('../services/geocodingService');
const { publishEvent } = require('../events/utils/publishEvent');
const { createBalancePromise } = require('../events/utils/balancePromises');
const { publishTenantUpdated, publishTenantDeleted } = require('../events/publishers/tenantPublisher');

async function getAllTenants(req, res) {
  try {
    let { page = 1, size = 10 } = req.query;

    page = parseInt(page);
    size = parseInt(size);

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
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

async function createTenant(req, res) {
  try {
    const {
      nombre,
      razon_social,
      cuenta_bancaria,
      email,
      telefono,
      calle,
      numero,
      ciudad,
      provincia,
      codigo_postal,
      sitio_web,
      instagram
    } = req.body;

    // Validar campos obligatorios
    const requiredFields = [
      'nombre',
      'razon_social',
      'cuenta_bancaria',
      'email',
      'telefono',
      'calle',
      'numero',
      'ciudad',
      'provincia',
      'codigo_postal'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Los siguientes campos son obligatorios: ${missingFields.join(', ')}`
      });
    }

    // Geocodificar la dirección
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

    // Separar datos para las diferentes tablas
    const tenantData = {
      nombre,
      razon_social,
      cuenta_bancaria
    };

    const contactData = {
      email,
      telefono,
      calle,
      numero,
      ciudad,
      provincia,
      codigo_postal,
      lat,
      lon,
      sitio_web,
      instagram
    };

    const newTenant = await TenantModel.create(tenantData, contactData);
    res.status(201).json(newTenant);

  } catch (error) {
    console.error('Error creating tenant:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

async function patchTenant(req, res) {
  try {
    const { tenantId } = req.params;
    const updateData = req.body;

    // Solo permitir modificar el propio tenant
    if (req.user.tenant_id !== parseInt(tenantId)) {
      return res.status(403).json({ message: 'No tienes permisos para modificar este tenant' });
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se enviaron campos para actualizar.' });
    }

    // Buscar el tenant
    const existingTenant = await TenantModel.getById(tenantId);
    if (!existingTenant) {
      return res.status(404).json({ message: 'Tenant no encontrado.' });
    }

    // Separar los campos según la tabla correspondiente
    const tenantFields = {};
    const contactFields = {};

    // Campos que pertenecen a la tabla tenant
    ['nombre', 'razon_social', 'cuenta_bancaria'].forEach(field => {
      if (updateData[field] !== undefined) {
        tenantFields[field] = updateData[field];
      }
    });

    // Campos que pertenecen a la tabla datos_contacto
    ['email', 'telefono', 'calle', 'numero', 'ciudad', 'provincia', 
     'codigo_postal', 'sitio_web', 'instagram'].forEach(field => {
      if (updateData[field] !== undefined) {
        contactFields[field] = updateData[field];
      }
    });

    // Si hay cambios en cualquier campo de dirección, recalcular lat/lon
    if (contactFields.calle || contactFields.numero || contactFields.ciudad || 
        contactFields.provincia || contactFields.codigo_postal) {
      
      // Combinar datos existentes con actualizaciones para geocodificación
      const addressToGeocode = {
        calle: contactFields.calle || existingTenant.calle,
        numero: contactFields.numero || existingTenant.numero,
        ciudad: contactFields.ciudad || existingTenant.ciudad,
        provincia: contactFields.provincia || existingTenant.provincia,
        codigo_postal: contactFields.codigo_postal || existingTenant.codigo_postal
      };

      try {
        const { lat, lon } = await geocodeAddress(addressToGeocode);
        contactFields.lat = lat;
        contactFields.lon = lon;
      } catch (geoError) {
        return res.status(400).json({
          message: 'Dirección inválida o no encontrada. Por favor verifica los datos ingresados.'
        });
      }
    }

    const updatedTenant = await TenantModel.patch(tenantId, tenantFields, contactFields);

    // Publicar evento tenant.actualizado
    try {
      await publishTenantUpdated(updatedTenant, updateData);
    } catch (eventError) {
      console.error('Error publishing tenant.actualizado event:', eventError);
      // No devolver error al frontend, el tenant se actualizó correctamente
    }

    res.json(updatedTenant);

  } catch (error) {
    console.error('Error actualizando tenant:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error interno del servidor.' });
    }
  }
}

async function deleteTenant(req, res) {
  try {
    const { tenantId } = req.params;

    const existingTenant = await TenantModel.getById(tenantId);
    if (!existingTenant) {
      return res.status(404).json({ message: 'Tenant no encontrado.' });
    }

    await TenantModel.delete(tenantId);

    // Publicar evento tenant.eliminado
    try {
      await publishTenantDeleted(tenantId, existingTenant.nombre);
    } catch (eventError) {
      console.error('Error publishing tenant.eliminado event:', eventError);
      // No devolver error al frontend, el tenant se eliminó correctamente
    }

    res.status(200).json({ 
      message: 'Tenant eliminado',
      tenant_id: parseInt(tenantId)
    });

  } catch (error) {
    console.error('Error eliminando tenant:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error interno del servidor.' });
    }
  }
}

async function getBalance(req, res) {
  try {
    // Obtener tenant_id del JWT del usuario autenticado
    const tenantId = req.user.tenant_id;

    if (!tenantId) {
      return res.status(400).json({ 
        message: 'Usuario no tiene tenant asociado' 
      });
    }

    // Consultar el email del tenant usando el modelo
    const result = await TenantModel.getEmailByTenantId(tenantId);

    if (!result.success) {
      const statusCode = result.error.includes('no encontrado') ? 404 : 400;
      return res.status(statusCode).json({ 
        message: result.error 
      });
    }

    // Usar tenant_id como traceId único
    const traceId = tenantId.toString();

    // Crear promesa para esperar la respuesta
    const balancePromise = createBalancePromise(traceId, 30000); // 30 segundos timeout

    // Publicar evento para solicitar balance
    try {
      await publishEvent('get.balances.request', {
        traceData: {
          originModule: 'marketplace-service',
          traceId: traceId
        },
        email: result.email
      });
    } catch (eventError) {
      console.error('Error publishing get.balances.request event:', eventError);
      return res.status(503).json({ 
        message: 'Servicio de blockchain no disponible temporalmente' 
      });
    }

    // Esperar la respuesta de blockchain
    try {
      const balance = await balancePromise;
      
      // Devolver solo los campos importantes al frontend
      res.status(200).json({
        fiatBalance: balance.fiatBalance,
        cryptoBalance: balance.cryptoBalance
      });

    } catch (timeoutError) {
      console.error('Timeout esperando respuesta de balance:', timeoutError);
      res.status(408).json({ 
        message: 'Timeout esperando respuesta del sistema de blockchain. Intente nuevamente.' 
      });
    }

  } catch (error) {
    console.error('Error solicitando balance:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { getAllTenants, createTenant, patchTenant, deleteTenant, getBalance };