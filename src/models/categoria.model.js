const pool = require('../config/db_connection');

const CategoriaModel = {
  // Obtener todas las categorías
  async getAll() {
    const result = await pool.query(`
      SELECT categoria_id, nombre, descripcion, fecha_creacion
      FROM categorias
    `);
    return result.rows;
  },

  // Obtener una categoría por ID
  async getById(id) {
    const result = await pool.query(`
      SELECT categoria_id, nombre, descripcion, fecha_creacion
      FROM categorias
      WHERE categoria_id = $1
    `, [id]);
    return result.rows[0];
  },

  // Crear una nueva categoría
  async create({ nombre, descripcion }) {
    const result = await pool.query(`
      INSERT INTO categorias (nombre, descripcion)
      VALUES ($1, $2)
      RETURNING categoria_id, nombre, descripcion, fecha_creacion
    `, [nombre, descripcion]);
    return result.rows[0];
  },

  // Obtener categorías que tienen productos de un tenant específico
  async getByTenant(tenantId) {
    const result = await pool.query(`
      SELECT DISTINCT c.categoria_id, c.nombre, c.descripcion, c.fecha_creacion
      FROM categorias c
      LEFT JOIN productos p ON c.categoria_id = p.categoria_id AND p.tenant_id = $1
      ORDER BY c.nombre
    `, [tenantId]);
    return result.rows;
  },

  // Verificar si una categoría tiene productos de un tenant específico
  async hasProductsFromTenant(categoriaId, tenantId) {
    const result = await pool.query(`
      SELECT EXISTS(
        SELECT 1 FROM productos 
        WHERE categoria_id = $1 AND tenant_id = $2
      ) as exists
    `, [categoriaId, tenantId]);
    return result.rows[0].exists;
  },

  // Actualizar una categoría
  async update(id, { nombre, descripcion }) {
    const result = await pool.query(`
      UPDATE categorias 
      SET nombre = $1, descripcion = $2
      WHERE categoria_id = $3
      RETURNING categoria_id, nombre, descripcion, fecha_creacion
    `, [nombre, descripcion, id]);
    return result.rows[0];
  },

  // Eliminar una categoría por ID
  async delete(id) {
    await pool.query(`
      DELETE FROM categorias WHERE categoria_id = $1
    `, [id]);
  }
};

module.exports = CategoriaModel;
