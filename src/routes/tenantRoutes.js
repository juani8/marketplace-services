const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

// Endpoint: GET /api/tenants
router.get('/', tenantController.getAllTenants);

module.exports = router;