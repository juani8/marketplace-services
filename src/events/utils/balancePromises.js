// Sistema para manejar promesas pendientes de balance
const pendingBalanceRequests = new Map();

/**
 * Crea una promesa para esperar la respuesta de balance
 * @param {string} traceId - ID único de la solicitud
 * @param {number} timeout - Timeout en milisegundos (default: 30 segundos)
 * @returns {Promise} Promesa que se resuelve cuando llega la respuesta
 */
function createBalancePromise(traceId, timeout = 30000) {
  return new Promise((resolve, reject) => {
    // Configurar timeout
    const timeoutId = setTimeout(() => {
      pendingBalanceRequests.delete(traceId);
      reject(new Error('Timeout esperando respuesta de balance'));
    }, timeout);

    // Guardar la promesa con su resolver y timeout
    pendingBalanceRequests.set(traceId, {
      resolve,
      reject,
      timeoutId
    });
  });
}

/**
 * Resuelve una promesa pendiente cuando llega la respuesta
 * @param {string} traceId - ID único de la solicitud
 * @param {Object} balanceData - Datos de balance recibidos
 */
function resolveBalancePromise(traceId, balanceData) {
  const pendingRequest = pendingBalanceRequests.get(traceId);
  
  if (pendingRequest) {
    clearTimeout(pendingRequest.timeoutId);
    pendingBalanceRequests.delete(traceId);
    pendingRequest.resolve(balanceData);
    return true;
  }
  
  return false;
}

/**
 * Rechaza una promesa pendiente con error
 * @param {string} traceId - ID único de la solicitud
 * @param {Error} error - Error a enviar
 */
function rejectBalancePromise(traceId, error) {
  const pendingRequest = pendingBalanceRequests.get(traceId);
  
  if (pendingRequest) {
    clearTimeout(pendingRequest.timeoutId);
    pendingBalanceRequests.delete(traceId);
    pendingRequest.reject(error);
    return true;
  }
  
  return false;
}

module.exports = {
  createBalancePromise,
  resolveBalancePromise,
  rejectBalancePromise
}; 