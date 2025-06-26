const { resolveBalancePromise } = require('../utils/balancePromises');

/**
 * Listener para procesar respuestas de consulta de balance de blockchain
 * @param {Object} event - Evento recibido del hub
 */
async function processEvent(event) {
  try {
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

    console.log('Balance recibido para email:', email, {
      fiatBalance,
      cryptoBalance,
      lastUpdated,
      traceId: traceData?.traceId
    });

    // Resolver la promesa pendiente si existe
    if (traceData && traceData.traceId) {
      const resolved = resolveBalancePromise(traceData.traceId, {
        fiatBalance,
        cryptoBalance
      });

      if (resolved) {
        console.log(`Promesa de balance resuelta para traceId: ${traceData.traceId}`);
      } else {
        console.log(`No se encontró promesa pendiente para traceId: ${traceData.traceId}`);
      }
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