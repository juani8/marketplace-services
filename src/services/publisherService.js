async function publishEvent(eventName, data) {
    try {
      // Simulación de envío a sistema de mensajería
      console.log(`[PUBLISH EVENT] Event: ${eventName}`);
      console.log(`[PUBLISH EVENT] Data:`, JSON.stringify(data, null, 2));
  
    // aca implementar logica de mensajeria con la libreria amqplib
    
    } catch (error) {
      console.error(`Error publicando evento ${eventName}:`, error.message);
    }
  }
  
  module.exports = { publishEvent };