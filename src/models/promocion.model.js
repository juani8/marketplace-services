const pool = require('../config/db_connection');

const PromocionModel = {
  // Método para obtener todas las promociones de un tenant específico
  async getAll(tenant_id) {
    const res = await pool.query(
      `SELECT DISTINCT pr.* 
       FROM promociones pr
       JOIN promociones_productos pp ON pr.promocion_id = pp.promocion_id
       JOIN productos p ON pp.producto_id = p.producto_id
       WHERE p.tenant_id = $1`,
      [tenant_id]
    );
    return res.rows;
  },

  // Método para crear una nueva promoción
  async create(data) {
    const {
      nombre,
      tipo_promocion,
      valor_descuento,
      fecha_inicio,
      fecha_fin
    } = data;

    const res = await pool.query(
      `INSERT INTO promociones
        (nombre, tipo_promocion, valor_descuento, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, tipo_promocion, valor_descuento, fecha_inicio, fecha_fin]
    );

    return res.rows[0];
  },

  // Método para actualizar una promoción
  async update(id, data) {
    // Filtrar solo los campos que se proporcionan
    const validFields = ['nombre', 'tipo_promocion', 'valor_descuento', 'fecha_inicio', 'fecha_fin'];
    const fieldsToUpdate = Object.keys(data).filter(key => validFields.includes(key) && data[key] !== undefined);
    
    if (fieldsToUpdate.length === 0) {
      // Si no hay campos para actualizar, obtener la promoción actual
      const res = await pool.query(
        'SELECT * FROM promociones WHERE promocion_id = $1',
        [id]
      );
      return res.rows[0];
    }

    // Construir la consulta dinámicamente
    const setClauses = fieldsToUpdate.map((field, index) => `${field} = $${index + 1}`);
    const values = fieldsToUpdate.map(field => data[field]);
    values.push(id); // Añadir el ID al final

    const query = `
      UPDATE promociones SET
        ${setClauses.join(',\n        ')}
      WHERE promocion_id = $${values.length}
      RETURNING *
    `;

    const res = await pool.query(query, values);
    return res.rows[0];
  },

  // Método para eliminar una promoción
  async delete(id) {
    await pool.query('DELETE FROM promociones WHERE promocion_id = $1', [id]);
  },

  // Método para agregar un producto a una promoción
  async agregarProducto(promocion_id, producto_id) {
    const res = await pool.query(
      `INSERT INTO promociones_productos (promocion_id, producto_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [promocion_id, producto_id]
    );

    return res.rows[0];
  },

  // Método para quitar un producto de una promoción
  async quitarProducto(promocion_id, producto_id) {
    await pool.query(
      `DELETE FROM promociones_productos
       WHERE promocion_id = $1 AND producto_id = $2`,
      [promocion_id, producto_id]
    );
  },

  // Método para obtener productos de una promoción
  async getProductosPorPromocion(promocion_id, tenant_id) {
    const res = await pool.query(
      `SELECT p.* FROM productos p
       JOIN promociones_productos pp ON p.producto_id = pp.producto_id
       WHERE pp.promocion_id = $1 AND p.tenant_id = $2`,
      [promocion_id, tenant_id]
    );

    return res.rows;
  },

  // Método para verificar si una promoción pertenece a un tenant
  async verificarPromocionTenant(promocion_id, tenant_id) {
    const res = await pool.query(
      `SELECT COUNT(*) > 0 as belongs
       FROM promociones pr
       JOIN promociones_productos pp ON pr.promocion_id = pp.promocion_id
       JOIN productos p ON pp.producto_id = p.producto_id
       WHERE pr.promocion_id = $1 AND p.tenant_id = $2`,
      [promocion_id, tenant_id]
    );
    return res.rows[0].belongs;
  }
};

module.exports = PromocionModel;