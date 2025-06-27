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

    console.log('\nVERIFICACIÓN DE CONEXIÓN CON CORE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Tópico:', topic);
    console.log('Challenge:', challenge);
    console.log('Estado: Verificación exitosa');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Responder con el challenge para confirmar la suscripción
    // El hub espera un 200 y el valor del challenge como texto plano
    return res.status(200).type('text/plain').send(challenge);

  } catch (error) {
    console.error('\nERROR DE VERIFICACIÓN CON CORE');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
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
    const contentType = req.headers['content-type'];

    console.log('\nEVENTO RECIBIDO DE CORE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Content-Type:', contentType);
    console.log('Datos:', JSON.stringify(eventData, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Si el evento viene con la estructura completa (topic/payload)
    if (eventData && eventData.topic && eventData.payload) {
      const listener = listeners[eventData.topic];
      if (!listener) {
        console.log('\nTÓPICO NO SOPORTADO, NO INCLUYE TOPIC EN EL JSON, INTENTAMOS SOLO CON PAYLOAD');
        
        return res.status(200).json({
          success: false,
          message: `Topic no soportado: ${eventData.topic}`
        });
      }

      console.log('\nPROCESANDO EVENTO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Tópico:', eventData.topic);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      const processed = await listener.processEvent(eventData);
      
      console.log('\nRESULTADO DEL PROCESAMIENTO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Tópico:', eventData.topic);
      console.log('Estado:', processed ? 'Exitoso' : 'Fallido');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      return processed ? res.status(204).send() : res.status(200).json({
        success: false,
        message: 'Evento no pudo ser procesado'
      });
    }

    // Si el evento viene en formato simple (solo con id), asumimos que es iva.pedido
    if (eventData && eventData.id) {
      console.log('\nPROCESANDO EVENTO SIMPLE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Tipo: iva.pedido (asumido)');
      console.log('ID:', eventData.id);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      const processed = await ivaPedidoListener.processEvent(eventData);

      console.log('\nRESULTADO DEL PROCESAMIENTO SIMPLE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Estado:', processed ? 'Exitoso' : 'Fallido');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      return processed ? res.status(204).send() : res.status(200).json({
        success: false,
        message: 'Evento no pudo ser procesado'
      });
    }

    // Si no cumple ninguna estructura válida
    console.log('\nEVENTO INVÁLIDO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Error: Estructura de evento inválida');
    console.log('Datos recibidos:', eventData);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return res.status(200).json({
      success: false,
      message: 'Estructura de evento inválida'
    });

  } catch (error) {
    console.error('\nERROR PROCESANDO EVENTO');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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