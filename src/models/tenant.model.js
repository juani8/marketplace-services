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
    const client = await pool.connect();
    try {
      const { 
        nombre, 
        razon_social, 
        cuenta_bancaria, 
        calle,
        numero,
        ciudad,
        provincia,
        codigo_postal,
        lat, 
        lon, 
        configuracion_operativa, 
        estado 
      } = tenantData;
    
      const res = await client.query(
        `INSERT INTO tenants 
          (nombre, razon_social, cuenta_bancaria, calle, numero, ciudad, provincia, codigo_postal, lat, lon, configuracion_operativa, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [nombre, razon_social, cuenta_bancaria, calle, numero, ciudad, provincia, codigo_postal, lat, lon, configuracion_operativa, estado]
      );

      return res.rows[0];
    } catch (error) {
      throw error;
    }
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
  },

  async patch(id, fieldsToUpdate) {
    const keys = Object.keys(fieldsToUpdate);
    if (keys.length === 0) {
      throw new Error('No hay campos para actualizar.');
    }
  
    // Generar dinámicamente el SET de SQL
    const setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  
    const values = Object.values(fieldsToUpdate);
  
    const res = await pool.query(
      `UPDATE tenants
       SET ${setQuery}, fecha_actualizacion = NOW()
       WHERE tenant_id = $${values.length + 1}
       RETURNING *`,
      [...values, id]
    );
  
    return res.rows[0];
  },

  async findNearbySellers(lat, lon, deliveryRadiusKm) {
    const res = await pool.query(
      `SELECT 
        tenant_id,
        nombre,
        razon_social,
        calle,
        numero,
        ciudad,
        provincia,
        codigo_postal,
        lat,
        lon,
        configuracion_operativa,
        estado,
        fecha_registro,
        fecha_actualizacion,
        (6371 * acos(
          cos(radians($1)) * cos(radians(lat)) * cos(radians(lon) - radians($2)) +
          sin(radians($1)) * sin(radians(lat))
        )) AS distance_km
      FROM tenants
      WHERE lat IS NOT NULL 
        AND lon IS NOT NULL 
        AND estado = 'activo'
      AND (6371 * acos(
          cos(radians($1)) * cos(radians(lat)) * cos(radians(lon) - radians($2)) +
          sin(radians($1)) * sin(radians(lat))
        )) <= $3
      ORDER BY distance_km ASC`,
      [lat, lon, deliveryRadiusKm]
    );
  
    return res.rows;
  },
};

module.exports = TenantModel;
