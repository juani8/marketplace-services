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

    // Si el evento viene con la estructura completa (topic/payload)
    if (eventData && eventData.topic && eventData.payload) {
      const listener = listeners[eventData.topic];
      if (!listener) {
        console.warn(`No hay listener registrado para el topic: ${eventData.topic}`);
        return res.status(200).json({
          success: false,
          message: `Topic no soportado: ${eventData.topic}`
        });
      }
      const processed = await listener.processEvent(eventData);
      return processed ? res.status(204).send() : res.status(200).json({
        success: false,
        message: 'Evento no pudo ser procesado'
      });
    }

    // Si el evento viene en formato simple (solo con id), asumimos que es iva.pedido
    if (eventData && eventData.id) {
      console.log('Procesando evento simple como iva.pedido');
      const processed = await ivaPedidoListener.processEvent(eventData);
      return processed ? res.status(204).send() : res.status(200).json({
        success: false,
        message: 'Evento no pudo ser procesado'
      });
    }

    // Si no cumple ninguna estructura válida
    console.warn('Evento recibido sin estructura válida:', eventData);
    return res.status(200).json({
      success: false,
      message: 'Estructura de evento inválida'
    });

  } catch (error) {
    console.error('Error procesando evento del hub:', error);
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