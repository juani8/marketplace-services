const TenantModel = require('../models/tenant.model');

async function getAllTenants(req, res) {
  try {
    const tenants = await TenantModel.getAll();
    res.json(tenants);
  } catch (error) {
    console.error('Error getting tenants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { getAllTenants };