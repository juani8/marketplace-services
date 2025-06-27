let authToken = null;

async function getAuthToken() {
  try {
    const url = new URL('https://hub.deliver.ar/auth/login');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: 'marketplace-service',
        password: '12345'
      })
    });

    if (!response.ok) {
      throw new Error(`Error en login: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data && data.access_token) {
      authToken = data.access_token;
      return authToken;
    }
    throw new Error('No se recibió access_token en la respuesta');
  } catch (error) {
    console.error('Error obteniendo token:', error.message);
    throw error;
  }
}

async function publishEvent(topic, payload) {
  const event = {
    topic,
    payload
  };

  try {
    console.log('\nEVENTO SALIENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Tópico:', topic);
    console.log('Datos:', JSON.stringify(payload, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Si no tenemos token o es la primera vez, obtenerlo
    if (!authToken) {
      await getAuthToken();
    }

    // Enviar el evento al Core
    const url = new URL('https://hub.deliver.ar/hub/publish');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(event)
    });

    // Si el token expiró, obtener uno nuevo y reintentar
    if (response.status === 401) {
      await getAuthToken();
      const retryUrl = new URL('https://hub.deliver.ar/hub/publish');
      const retryResponse = await fetch(retryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!retryResponse.ok) {
        throw new Error(`Error en reintento: ${retryResponse.status} ${retryResponse.statusText}`);
      }
    } else if (!response.ok) {
      throw new Error(`Error publicando evento: ${response.status} ${response.statusText}`);
    }

    console.log('✅ Evento publicado exitosamente al Core');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return true;
  } catch (error) {
    console.error('❌ Error al publicar evento en', topic + ':', error.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return false;
  }
}

module.exports = publishEvent;
