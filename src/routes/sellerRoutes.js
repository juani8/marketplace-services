const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');

// Ruta principal de sellers (con geolocalización)
router.get('/', sellerController.getSellersNearby);

module.exports = router;
