const pool = require('../config/db_connection');

// Modelo de Tenant
const TenantModel = {
  async getAll(page = 1, size = 10) {
    const limit = size;
    const offset = (page - 1) * size;

    const res = await pool.query(
      `SELECT 
        t.*,
        dc.email,
        dc.telefono,
        dc.movil,
        dc.direccion AS direccion_contacto,
        dc.sitio_web,
        dc.linkedin
      FROM tenants t
      LEFT JOIN datos_contacto dc ON t.tenant_id = dc.tenant_id
      ORDER BY t.tenant_id
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countRes = await pool.query('SELECT COUNT(*) FROM tenants');
    const totalItems = parseInt(countRes.rows[0].count);

    return {
      data: res.rows,
      totalItems
    };
  },

  // Método para obtener un tenant por ID
  async getById(id) {
    const res = await pool.query('SELECT * FROM tenants WHERE tenant_id = $1', [id]);
    return res.rows[0];
  },

  // Método para crear un nuevo tenant
  async create(tenantData) {
    const {
      nombre,
      razon_social,
      cuenta_bancaria,
      datos_contacto,
      direccion,
      configuracion_operativa,
      catalogo_id,
      estado
    } = tenantData;

    const res = await pool.query(
      `INSERT INTO tenants 
      (nombre, razon_social, cuenta_bancaria, datos_contacto, direccion, configuracion_operativa, catalogo_id, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        nombre,
        razon_social,
        cuenta_bancaria,
        datos_contacto,
        direccion,
        configuracion_operativa,
        catalogo_id,
        estado
      ]
    );

    return res.rows[0];
  },

  // Método para actualizar un tenant
  async update(id, updateData) {
    const { nombre, razon_social } = updateData;
    const res = await pool.query(
      `UPDATE tenants SET nombre = $1, razon_social = $2, fecha_actualizacion = NOW()
       WHERE tenant_id = $3 RETURNING *`,
      [nombre, razon_social, id]
    );
    return res.rows[0];
  },

  // Método para eliminar un tenant
  async delete(id) {
    await pool.query('DELETE FROM tenants WHERE tenant_id = $1', [id]);
  }
};

module.exports = TenantModel;
