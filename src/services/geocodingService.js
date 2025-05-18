require('dotenv').config();

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

/**
 * Geocodifica una dirección en Argentina usando los campos separados
 * @param {Object} direccion Objeto con los campos de dirección
 * @param {string} direccion.calle Nombre de la calle
 * @param {string} direccion.numero Número de la dirección
 * @param {string} direccion.ciudad Ciudad
 * @param {string} direccion.provincia Provincia
 * @param {string} direccion.codigo_postal Código Postal
 * @returns {Promise<{lat: number, lon: number}>}
 */
async function geocodeAddress({ calle, numero, ciudad, provincia, codigo_postal }) {
  try {
    if (!calle || !numero || !ciudad || !provincia) {
      throw new Error('Todos los campos de dirección son requeridos (calle, numero, ciudad, provincia)');
    }

    const direccionFormateada = `${calle} ${numero}, ${codigo_postal || ''}, ${ciudad}, ${provincia}, Argentina`;
    const url = new URL('https://us1.locationiq.com/v1/search');
    
    // Agregar parámetros a la URL
    const params = {
      key: LOCATIONIQ_API_KEY,
      q: direccionFormateada,
      format: 'json',
      limit: '1',
      countrycodes: 'ar',
      addressdetails: '1' // Para obtener detalles adicionales como el código postal
    };
    
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error(`No se encontró la dirección: ${direccionFormateada}`);
    }

    const location = data[0];
    return {
      lat: parseFloat(location.lat),
      lon: parseFloat(location.lon)
    };
  } catch (error) {
    console.error('Error en geocoding:', error);
    throw new Error('Error al geocodificar la dirección: ' + error.message);
  }
}

module.exports = { geocodeAddress };
