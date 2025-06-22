const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);

router.post('/register-tenant', authController.registerTenant)

router.post('/register-internal', authController.registerInternalUser)

module.exports = router;