const pool = require('../config/db_connection');

class OrderModel {
  /**
   * Obtiene todas las órdenes de un comercio específico
   * @param {number} comercioId - ID del comercio
   * @returns {Promise<Array>} Array de órdenes
   */
  static async getByComercioId(comercioId) {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          orden_id,
          tenant_id,
          comercio_id,
          cliente_nombre,
          medios_pago,
          estado,
          total,
          direccion_entrega,
          fecha_creacion,
          fecha_actualizacion
        FROM ordenes 
        WHERE comercio_id = $1
        ORDER BY fecha_creacion DESC
      `;

      const result = await client.query(query, [comercioId]);
      return result.rows;

    } finally {
      client.release();
    }
  }

  /**
   * Obtiene una orden específica por su ID
   * @param {number} orderId - ID de la orden
   * @returns {Promise<Object|null>} Orden encontrada o null si no existe
   */
  static async getById(orderId) {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          o.orden_id,
          o.tenant_id,
          o.comercio_id,
          o.cliente_nombre,
          o.medios_pago,
          o.estado,
          o.total,
          o.direccion_entrega,
          o.fecha_creacion,
          o.fecha_actualizacion
        FROM ordenes o
        WHERE o.orden_id = $1
      `;

      const result = await client.query(query, [orderId]);
      return result.rows[0] || null;

    } finally {
      client.release();
    }
  }
}

module.exports = OrderModel; 