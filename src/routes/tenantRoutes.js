const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Endpoint: GET /api/tenants (solo admins pueden ver todos los tenants)
router.get('/', authenticateToken, tenantController.getAllTenants);

// POST /api/tenants (crear tenant - solo para súper admins, por ahora protegido)
router.post('/', authenticateToken, tenantController.createTenant);

// GET /api/tenants/balance (consultar balance de blockchain del tenant autenticado)
router.get('/balance', authenticateToken, tenantController.getBalance);

// PATCH /api/tenants/:id (solo admins del mismo tenant)
router.patch('/:tenantId', authenticateToken, tenantController.patchTenant);

// DELETE /api/tenants/:tenantId (solo admins del mismo tenant)
router.delete('/:tenantId', authenticateToken, tenantController.deleteTenant);

module.exports = router;


