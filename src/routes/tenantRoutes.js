const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

// Endpoint: GET /api/tenants
router.get('/', tenantController.getAllTenants);


// POST /api/tenants
router.post('/', tenantController.createTenant);


// PATCH /api/tenants/:id
router.patch('/:tenantId', tenantController.patchTenant);


// DELETE /api/tenants/:tenantId
router.delete('/:tenantId', tenantController.deleteTenant);

module.exports = router;


