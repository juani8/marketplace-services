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

  // Eliminar una categoría por ID
  async delete(id) {
    await pool.query(`
      DELETE FROM categorias WHERE categoria_id = $1
    `, [id]);
  }
};

module.exports = CategoriaModel;
