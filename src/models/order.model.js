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
}

module.exports = OrderModel; 