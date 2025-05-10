const pool = require('../config/db_connection');

const CatalogoModel = {
  // Método para obtener todos los catálogos
  async getAll() {
    const res = await pool.query('SELECT * FROM catalogos');
    return res.rows;
  },

  // Método para obtener un catálogo por ID
  async getById(id) {
    const res = await pool.query('SELECT * FROM catalogos WHERE catalogo_id = $1', [id]);
    return res.rows[0];
  },

  // Método para obtener catálogos por tenant_id
  async getByTenantId(tenantId) {
    const res = await pool.query('SELECT * FROM catalogos WHERE tenant_id = $1', [tenantId]);
    return res.rows;
  },

  // Método para crear un nuevo catálogo
  async create({ tenant_id }) {
    const res = await pool.query(
      'INSERT INTO catalogos (tenant_id) VALUES ($1) RETURNING *',
      [tenant_id]
    );
    return res.rows[0];
  },

  // Método para borrar un catálogo
  async delete(id) {
    await pool.query('DELETE FROM catalogos WHERE catalogo_id = $1', [id]);
  },

  // Método para borrar catálogos por tenant_id
  async deleteByTenantId(tenantId) {
    await pool.query('DELETE FROM catalogos WHERE tenant_id = $1', [tenantId]);
  },

  // Método para actualizar la fecha de actualización de un catálogo
  async updateFechaActualizacion(catalogoId) {
    try {
      const query = 'UPDATE catalogos SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE catalogo_id = $1 RETURNING *';
      const result = await pool.query(query, [catalogoId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error actualizando fecha de catálogo:', error);
      throw error;
    }
  },
};

module.exports = CatalogoModel;
