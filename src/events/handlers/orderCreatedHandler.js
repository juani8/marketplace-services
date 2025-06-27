const OrderModel = require('../../models/order.model');
const { publishOrderConfirmation } = require('../publishers/orderPublisher');

/**
 * Maneja el evento pedido.creado
 * @param {Object} event - Evento recibido
 */
async function handle(event) {
  try {
    // Validar estructura del evento
    if (!event?.payload?.pedidoId || !event?.payload?.comercio_id || !event?.payload?.productos) {
      console.error('Evento pedido.creado inválido:', event);
      return false;
    }

    const orderData = event.payload;

    // Obtener tenant_id del comercio
    const tenant_id = await OrderModel.getTenantIdByComercioId(orderData.comercio_id);
    if (!tenant_id) {
      console.error(`No se encontró tenant_id para el comercio_id: ${orderData.comercio_id}`);
      return false;
    }

    // Validar stock de productos
    const stockValidation = await OrderModel.validateStock(orderData.comercio_id, orderData.productos);
    if (!stockValidation.success) {
      console.error('Error de validación de stock:', stockValidation.message);
      return false;
    }

    // Crear el pedido con el tenant_id
    const orderToCreate = {
      ...orderData,
      tenant_id
    };

    // Insertar el pedido y actualizar stock
    await OrderModel.create(orderToCreate);

    console.log(`Pedido ${orderData.pedidoId} creado exitosamente en estado 'pendiente'`);

    // Publicar confirmación
    await publishOrderConfirmation(orderData);

    console.log(`Evento pedido.confirmar publicado para pedido ${orderData.pedidoId}`);

    // Actualizar automáticamente el estado a 'listo' después de la confirmación
    await OrderModel.updateStatus(orderData.pedidoId, 'listo');

    console.log(`Pedido ${orderData.pedidoId} actualizado automáticamente a estado 'listo'`);

    return true;
  } catch (error) {
    console.error('Error procesando pedido.creado:', error);
    return false;
  }
}

module.exports = {
  handle
}; 