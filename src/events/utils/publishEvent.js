async function publishEvent(topic, payload) {
  const event = {
    topic,
    payload
  };

  try {
    // TODO: Implementar el envío real al Core
    console.log(`Evento a publicar en Core (${topic}):`, JSON.stringify(event, null, 2));
    return true;
  } catch (error) {
    console.error(`Error al publicar evento ${topic}:`, error.message);
    return false;
  }
}

module.exports = publishEvent;
