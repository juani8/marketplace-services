async function publishEvent(topic, payload, to = null) {
  const event = {
    by: 'Marketplace',
    topic,
    ...(to && { to }),
    payload
  };

  try {
    // TODO: Implementar el envío real al Core
    console.log(`Evento a publicar en Core (${topic}):`, event);
    return true;
  } catch (error) {
    console.error(`Error al publicar evento ${topic}:`, error.message);
    return false;
  }
}

module.exports = publishEvent;
