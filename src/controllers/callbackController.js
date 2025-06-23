// Controlador para manejar callbacks del hub de eventos de core.deliver.ar
const ivaPedidoListener = require('../events/subscribers/ivaPedidoListener');
const obtenerVentasPorMesListener = require('../events/subscribers/obtenerVentasPorMesListener');
const deliverySuccessfulListener = require('../events/subscribers/deliverySuccessfulListener');
const deliveryFailedListener = require('../events/subscribers/deliveryFailedListener');

// Mapa de listeners por topic
const listeners = {
  'iva.pedido': ivaPedidoListener,
  'ventas.por_mes': obtenerVentasPorMesListener,
  'delivery.successful': deliverySuccessfulListener,
  'delivery.failed': deliveryFailedListener
};

// GET /callback - Verificación de suscripción por parte del hub
async function getCallback(req, res) {
  try {
    const { topic, challenge } = req.query;

    // Validar que los parámetros requeridos estén presentes
    if (!topic || !challenge) {
      return res.status(400).json({
        success: false,
        message: 'Los parámetros topic y challenge son requeridos'
      });
    }

    console.log(`[HUB VERIFICATION] Topic: ${topic}, Challenge: ${challenge}`);

    // Responder con el challenge para confirmar la suscripción
    // El hub espera un 200 y el valor del challenge como texto plano
    return res.status(200).type('text/plain').send(challenge);

  } catch (error) {
    console.error('Error en verificación de callback:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// POST /callback - Recepción de eventos del hub
async function postCallback(req, res) {
  try {
    const eventData = req.body;

    console.log('[HUB EVENT RECEIVED] Body:', JSON.stringify(eventData, null, 2));
    console.log('[HUB EVENT RECEIVED] Headers:', req.headers);
    console.log('[HUB EVENT RECEIVED] Content-Type:', req.headers['content-type']);

    // Validar que el evento tenga la estructura esperada
    if (!eventData || !eventData.topic || !eventData.payload) {
      console.warn('Evento recibido sin estructura válida. Body:', eventData);
      console.warn('Tipo de eventData:', typeof eventData);
      console.warn('Keys en eventData:', Object.keys(eventData));
      // Devolver 200 para evitar reintentos del hub
      return res.status(200).json({
        success: false,
        message: 'Estructura de evento inválida'
      });
    }

    // Obtener el listener correspondiente al topic
    const listener = listeners[eventData.topic];
    
    if (!listener) {
      console.warn(`No hay listener registrado para el topic: ${eventData.topic}`);
      return res.status(200).json({
        success: false,
        message: `Topic no soportado: ${eventData.topic}`
      });
    }

    // Procesar el evento usando el listener correspondiente
    const processed = await listener.processEvent(eventData);

    if (processed) {
      // Evento procesado correctamente - devolver 204 (No Content)
      return res.status(204).send();
    } else {
      // No se pudo procesar - devolver 200 para evitar reintentos
      return res.status(200).json({
        success: false,
        message: 'Evento no pudo ser procesado'
      });
    }

  } catch (error) {
    console.error('Error procesando evento del hub:', error);
    // Devolver 200 para evitar reintentos en caso de error
    return res.status(200).json({
      success: false,
      message: 'Error procesando evento'
    });
  }
}

module.exports = {
  getCallback,
  postCallback
}; 