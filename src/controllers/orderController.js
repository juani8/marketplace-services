const OrderModel = require('../models/order.model');

/**
 * Obtiene todas las órdenes de un comercio
 * @param {Request} req Request object
 * @param {Response} res Response object
 */
async function getOrdersByComercio(req, res) {
  try {
    const { comercio_id } = req.params;
    const orders = await OrderModel.getByComercioId(comercio_id);

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Error al obtener órdenes del comercio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las órdenes'
    });
  }
}

module.exports = {
  getOrdersByComercio
}; 