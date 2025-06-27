const OrderModel = require('../models/order.model');
const SellerModel = require('../models/seller.model');

/**
 * Obtiene todas las órdenes de un comercio
 * @param {Request} req Request object
 * @param {Response} res Response object
 */
async function getOrdersByComercio(req, res) {
  try {
    const { comercio_id } = req.params;
    
    // Verificar que el comercio existe y pertenece al tenant del usuario
    const comercio = await SellerModel.getById(parseInt(comercio_id));
    if (!comercio) {
      return res.status(404).json({
        success: false,
        message: 'Comercio no encontrado'
      });
    }

    // Verificar que el comercio pertenece al tenant del usuario
    if (comercio.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a las órdenes de este comercio'
      });
    }

    // Si no es admin, verificar que el usuario tiene acceso a este comercio en la base de datos
    if (req.user.rol !== 'admin') {
      const hasAccess = await SellerModel.hasUserAccessToComercio(req.user.usuario_id, parseInt(comercio_id));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a las órdenes de este comercio'
        });
      }
    }
    
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