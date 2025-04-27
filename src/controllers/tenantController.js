const TenantModel = require('../models/tenant.model');
const { publishEvent } = require('../services/publisherService');

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
    const { nombre, razon_social, cuenta_bancaria, direccion, configuracion_operativa } = req.body;

  
    // Validaciones
    if (!nombre || !razon_social) {
      return res.status(400).json({ message: 'Nombre y razón social son obligatorios' });
    }

    const newTenant = await TenantModel.create({
      nombre,
      razon_social,
      cuenta_bancaria,
      direccion,
      configuracion_operativa,
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

module.exports = { getAllTenants, createTenant };