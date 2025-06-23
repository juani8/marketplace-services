// Controlador para manejar callbacks del hub de eventos de core.deliver.ar

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

    console.log('[HUB EVENT RECEIVED]', JSON.stringify(eventData, null, 2));

    // Validar que el evento tenga la estructura esperada
    if (!eventData || !eventData.event) {
      console.warn('Evento recibido sin estructura válida:', eventData);
      // Devolver 200 para evitar reintentos del hub
      return res.status(200).json({
        success: false,
        message: 'Estructura de evento inválida'
      });
    }

    // Procesar diferentes tipos de eventos
    const processed = await processEvent(eventData);

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

// Función auxiliar para procesar diferentes tipos de eventos
async function processEvent(eventData) {
  try {
    const { event, data } = eventData;

    switch (event) {
      case 'pedido.creado':
        return await processPedidoCreado(data);
      
      case 'pedido.actualizado':
        return await processPedidoActualizado(data);
      
      case 'pedido.cancelado':
        return await processPedidoCancelado(data);
      
      case 'pago.confirmado':
        return await processPagoConfirmado(data);
      
      case 'entrega.iniciada':
        return await processEntregaIniciada(data);
      
      case 'entrega.completada':
        return await processEntregaCompletada(data);
      
      default:
        console.warn(`Tipo de evento no manejado: ${event}`);
        return false;
    }

  } catch (error) {
    console.error('Error en processEvent:', error);
    return false;
  }
}

// Procesadores específicos para cada tipo de evento
async function processPedidoCreado(data) {
  try {
    console.log('[PEDIDO CREADO]', data);
    
    // Aquí implementarías la lógica específica para pedidos creados
    // Por ejemplo:
    // - Actualizar stock de productos
    // - Notificar al comercio
    // - Registrar en base de datos local
    
    const { orderId, customer, items } = data;
    
    if (!orderId || !items) {
      console.warn('Datos de pedido incompletos:', data);
      return false;
    }

    // TODO: Implementar lógica de negocio
    // - Reducir stock de productos
    // - Crear registro de orden local si es necesario
    // - Enviar notificaciones
    
    console.log(`Pedido ${orderId} procesado correctamente`);
    return true;

  } catch (error) {
    console.error('Error procesando pedido creado:', error);
    return false;
  }
}

async function processPedidoActualizado(data) {
  try {
    console.log('[PEDIDO ACTUALIZADO]', data);
    
    // TODO: Implementar lógica para pedidos actualizados
    
    return true;
  } catch (error) {
    console.error('Error procesando pedido actualizado:', error);
    return false;
  }
}

async function processPedidoCancelado(data) {
  try {
    console.log('[PEDIDO CANCELADO]', data);
    
    // TODO: Implementar lógica para pedidos cancelados
    // - Restaurar stock de productos
    // - Notificar al comercio
    
    return true;
  } catch (error) {
    console.error('Error procesando pedido cancelado:', error);
    return false;
  }
}

async function processPagoConfirmado(data) {
  try {
    console.log('[PAGO CONFIRMADO]', data);
    
    // TODO: Implementar lógica para pagos confirmados
    
    return true;
  } catch (error) {
    console.error('Error procesando pago confirmado:', error);
    return false;
  }
}

async function processEntregaIniciada(data) {
  try {
    console.log('[ENTREGA INICIADA]', data);
    
    // TODO: Implementar lógica para entregas iniciadas
    
    return true;
  } catch (error) {
    console.error('Error procesando entrega iniciada:', error);
    return false;
  }
}

async function processEntregaCompletada(data) {
  try {
    console.log('[ENTREGA COMPLETADA]', data);
    
    // TODO: Implementar lógica para entregas completadas
    
    return true;
  } catch (error) {
    console.error('Error procesando entrega completada:', error);
    return false;
  }
}

module.exports = {
  getCallback,
  postCallback
}; 