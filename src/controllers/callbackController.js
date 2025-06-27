// Controlador para manejar callbacks del hub de eventos de core.deliver.ar
const ivaPedidoListener = require('../events/subscribers/ivaOrderListener');
const ventasMesListener = require('../events/subscribers/ventasMesListener');
const deliverySuccessfulListener = require('../events/subscribers/deliverySuccessfulListener');
const deliveryFailedListener = require('../events/subscribers/deliveryFailedListener');

// Mapa de listeners por topic
const listeners = {
  'iva.pedido': ivaPedidoListener,
  'ventas.mes': ventasMesListener,
  'delivery.successful': deliverySuccessfulListener,
  'delivery.failed': deliveryFailedListener
};

/**
 * Verifica la suscripción respondiendo con el challenge recibido
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function verifySubscription(req, res) {
  try {
    const { topic, challenge } = req.query;

    console.log('\nVERIFICACIÓN DE SUSCRIPCIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Tópico:', topic);
    console.log('Challenge:', challenge);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Devolver el challenge tal cual lo recibimos
    res.status(200).send(challenge);
  } catch (error) {
    console.error('Error en verificación de suscripción:', error);
    res.status(500).send('Error interno del servidor');
  }
}

/**
 * Procesa los eventos recibidos del Core
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function processEvent(req, res) {
  try {
    const eventData = req.body;
    let topic, payload;

    console.log('\nEVENTO ENTRANTE DEL CORE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Datos recibidos:', JSON.stringify(eventData, null, 2));

    // Determinar el formato del evento
    if (eventData.topic && eventData.payload) {
      // Formato con topic y payload explícitos
      topic = eventData.topic;
      payload = eventData.payload;
      console.log('Formato: Con topic y payload');
    } else {
      // Formato sin topic/payload (payload directo)
      payload = eventData;
      // Aquí podrías determinar el topic basado en algún campo del payload
      // o usar el topic que viene en los headers si es que el Core lo envía
      topic = req.headers['x-topic'] || 'unknown';
      console.log('Formato: Payload directo');
    }

    console.log('Tópico identificado:', topic);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // TODO: Implementar el procesamiento según el tipo de evento
    // Por ejemplo:
    // switch (topic) {
    //   case 'tenant.creado':
    //     await processTenantCreado(payload);
    //     break;
    //   // ... otros casos
    // }
    
    // Responder 204 para indicar que procesamos correctamente
    res.sendStatus(204);
  } catch (error) {
    console.error('Error procesando evento:', error);
    // Responder 200 para evitar reintentos en caso de error
    res.sendStatus(200);
  }
}

module.exports = {
  verifySubscription,
  processEvent
}; 