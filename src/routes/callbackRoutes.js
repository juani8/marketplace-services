const express = require('express');
const router = express.Router();
const callbackController = require('../controllers/callbackController');

// ============ RUTAS PARA INTEGRACIÓN CON HUB DE EVENTOS ============

// GET /callback - Verificación de suscripción por parte del hub
// Recibe: topic y challenge como query params
// Responde: 200 con el valor del challenge en texto plano
router.get('/callback', callbackController.getCallback);

// POST /callback - Recepción de eventos del hub
// Recibe: JSON con estructura { event: "tipo.evento", data: {...} }
// Responde: 204 si procesó correctamente, 200 si hubo error (para evitar reintentos)
router.post('/callback', callbackController.postCallback);

module.exports = router; 