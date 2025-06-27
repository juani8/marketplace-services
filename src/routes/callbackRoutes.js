const express = require('express');
const router = express.Router();
const callbackController = require('../controllers/callbackController');

// ============ RUTAS PARA INTEGRACIÓN CON HUB DE EVENTOS ============

// GET /callback - Para verificación de suscripción
router.get('/', callbackController.verifySubscription);

// POST /callback - Para recibir eventos
router.post('/', callbackController.processEvent);

module.exports = router; 