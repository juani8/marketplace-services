require('dotenv').config();

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

async function geocodeAddress(address) {
  const url = `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(address)}&format=json&limit=1`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Error al consultar la API de geocodificación.');
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    throw new Error('No se pudo geolocalizar la dirección.');
  }

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };
}

module.exports = { geocodeAddress };
