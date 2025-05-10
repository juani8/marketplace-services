const TenantModel = require('../models/tenant.model');

const DELIVERY_RADIUS_KM = 5; // Radio fijo de entrega

async function getSellersNearby(req, res) {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ message: 'Latitud y longitud son requeridas.' });
    }

    // Convertimos lat y lon a número
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: 'Latitud o longitud inválidas.' });
    }

    // Buscar sellers cercanos
    const sellers = await TenantModel.findNearbySellers(latitude, longitude, DELIVERY_RADIUS_KM);

    res.json(sellers);

  } catch (error) {
    console.error('Error buscando sellers cercanos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = { 
  getSellersNearby
};
