const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);

router.post('/register-tenant', authController.registerTenant)

router.post('/register-internal', authenticateToken, authController.registerInternalUser)

// Nuevas rutas JWT
router.post('/refresh', authController.refreshToken);
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;