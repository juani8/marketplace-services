const pool = require('../config/db');

const PromocionModel = {
  // Método para obtener todas las promociones
  async getAll() {
    const res = await pool.query('SELECT * FROM promociones');
    return res.rows;
  },

  // Método para obtener una promoción por ID
  async getById(id) {
    const res = await pool.query('SELECT * FROM promociones WHERE promocion_id = $1', [id]);
    return res.rows[0];
  },

  // Método para obtener promociones por tenant_id
  async getByTenantId(tenant_id) {
    const res = await pool.query('SELECT * FROM promociones WHERE tenant_id = $1', [tenant_id]);
    return res.rows;
  },

  // Método para crear una nueva promoción
  async create(data) {
    const {
      tenant_id,
      nombre,
      descripcion,
      tipo_promocion,
      fecha_inicio,
      fecha_fin,
      estado
    } = data;

    const res = await pool.query(
      `INSERT INTO promociones
        (tenant_id, nombre, descripcion, tipo_promocion, fecha_inicio, fecha_fin, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tenant_id, nombre, descripcion, tipo_promocion, fecha_inicio, fecha_fin, estado]
    );

    return res.rows[0];
  },

  // Método para actualizar una promoción
  async update(id, data) {
    const {
      nombre,
      descripcion,
      tipo_promocion,
      fecha_inicio,
      fecha_fin,
      estado
    } = data;

    const res = await pool.query(
      `UPDATE promociones SET
        nombre = $1,
        descripcion = $2,
        tipo_promocion = $3,
        fecha_inicio = $4,
        fecha_fin = $5,
        estado = $6
       WHERE promocion_id = $7
       RETURNING *`,
      [nombre, descripcion, tipo_promocion, fecha_inicio, fecha_fin, estado, id]
    );

    return res.rows[0];
  },

  // Método para eliminar una promoción
  async delete(id) {
    await pool.query('DELETE FROM promociones WHERE promocion_id = $1', [id]);
  },

  // Método para agregar un producto a una promoción
  async agregarProducto(promocion_id, producto_id) {
    const res = await pool.query(
      `INSERT INTO productos_promociones (promocion_id, producto_id)
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
      `DELETE FROM productos_promociones
       WHERE promocion_id = $1 AND producto_id = $2`,
      [promocion_id, producto_id]
    );
  },

  // Método para obtener productos de una promoción
  async getProductosPorPromocion(promocion_id) {
    const res = await pool.query(
      `SELECT p.* FROM productos p
       JOIN productos_promociones pp ON p.producto_id = pp.producto_id
       WHERE pp.promocion_id = $1`,
      [promocion_id]
    );

    return res.rows;
  }
};

module.exports = PromocionModel;