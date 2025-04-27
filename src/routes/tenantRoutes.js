const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

// Endpoint: GET /api/tenants
router.get('/', tenantController.getAllTenants);


// POST /api/tenants
router.post('/', tenantController.createTenant);

module.exports = router;