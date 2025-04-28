const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');

// Endpoint: GET /api/sellers?lat=...&lon=...
router.get('/', sellerController.getSellersNearby);

module.exports = router;
