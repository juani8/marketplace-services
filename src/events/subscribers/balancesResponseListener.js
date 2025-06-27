const { resolveBalancePromise } = require('../utils/balancePromises');

/**
 * Listener para procesar respuestas de consulta de balance de blockchain
 * @param {Object} event - Evento recibido del hub
 */
async function processEvent(event) {
  try {
    console.log('\nEVENTO ENTRANTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Tópico: get.balances.response');
    console.log('Datos:', JSON.stringify(event.payload, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Validar que el evento tenga la estructura esperada
    if (!event || !event.payload) {
      console.error('Evento get.balances.response inválido:', event);
      return false;
    }

    const { traceData, email, fiatBalance, cryptoBalance, lastUpdated } = event.payload;

    // Validar campos obligatorios
    if (!email || fiatBalance === undefined || cryptoBalance === undefined) {
      console.error('Evento get.balances.response con datos incompletos:', event.payload);
      return false;
    }

    // Validar que sea para nuestro módulo
    if (traceData && traceData.originModule !== 'marketplace-service') {
      console.log('Evento no es para marketplace-service, ignorando');
      return true;
    }

    // Resolver la promesa pendiente si existe
    if (traceData && traceData.traceId) {
      const resolved = resolveBalancePromise(traceData.traceId, {
        fiatBalance,
        cryptoBalance
      });

      console.log('\nRESOLUCIÓN DE BALANCE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('ID de Rastreo:', traceData.traceId);
      console.log('Email:', email);
      console.log('Balances:', { fiatBalance, cryptoBalance });
      console.log('Estado de Resolución:', resolved ? 'Resuelto' : 'No se encontró promesa pendiente');
      console.log('Última Actualización:', lastUpdated);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    return true;

  } catch (error) {
    console.error('Error procesando evento get.balances.response:', error);
    return false;
  }
}

// Configuración del subscriber
const subscriber = {
  topic: 'get.balances.response',
  processEvent
};

module.exports = subscriber; 