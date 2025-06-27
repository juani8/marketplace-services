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
        dc.calle,
        dc.numero,
        dc.ciudad,
        dc.provincia,
        dc.codigo_postal,
        dc.lat,
        dc.lon,
        dc.sitio_web,
        dc.instagram
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
    const res = await pool.query(
      `SELECT 
        t.*,
        dc.email,
        dc.telefono,
        dc.calle,
        dc.numero,
        dc.ciudad,
        dc.provincia,
        dc.codigo_postal,
        dc.lat,
        dc.lon,
        dc.sitio_web,
        dc.instagram
      FROM tenants t
      LEFT JOIN datos_contacto dc ON t.tenant_id = dc.tenant_id
      WHERE t.tenant_id = $1`,
      [id]
    );
    return res.rows[0];
  },

  // Método para crear un nuevo tenant
  async create(tenantData, contactData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert tenant
      const tenantRes = await client.query(
        `INSERT INTO tenants (nombre, razon_social, cuenta_bancaria, estado)
         VALUES ($1, $2, $3, 'activo')
         RETURNING *`,
        [tenantData.nombre, tenantData.razon_social, tenantData.cuenta_bancaria]
      );

      const tenant = tenantRes.rows[0];

      // Insert contact data
      const contactRes = await client.query(
        `INSERT INTO datos_contacto 
         (tenant_id, email, telefono, calle, numero, ciudad, provincia, codigo_postal, lat, lon, sitio_web, instagram)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          tenant.tenant_id,
          contactData.email,
          contactData.telefono,
          contactData.calle,
          contactData.numero,
          contactData.ciudad,
          contactData.provincia,
          contactData.codigo_postal,
          contactData.lat,
          contactData.lon,
          contactData.sitio_web,
          contactData.instagram
        ]
      );

      await client.query('COMMIT');

      // Estructurar la respuesta en el orden deseado
      return {
        tenant_id: tenant.tenant_id,
        nombre: tenant.nombre,
        razon_social: tenant.razon_social,
        cuenta_bancaria: tenant.cuenta_bancaria,
        email: contactRes.rows[0].email,
        telefono: contactRes.rows[0].telefono,
        calle: contactRes.rows[0].calle,
        numero: contactRes.rows[0].numero,
        ciudad: contactRes.rows[0].ciudad,
        provincia: contactRes.rows[0].provincia,
        codigo_postal: contactRes.rows[0].codigo_postal,
        sitio_web: contactRes.rows[0].sitio_web || null,
        instagram: contactRes.rows[0].instagram || null,
        lat: contactRes.rows[0].lat,
        lon: contactRes.rows[0].lon,
        estado: tenant.estado,
        fecha_registro: tenant.fecha_registro,
        fecha_actualizacion: tenant.fecha_actualizacion
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM datos_contacto WHERE tenant_id = $1', [id]);
      await client.query('DELETE FROM tenants WHERE tenant_id = $1', [id]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async patch(id, tenantFields = {}, contactFields = {}) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let updatedTenant = null;
      let updatedContact = null;

      // Update tenant if there are tenant fields
      if (Object.keys(tenantFields).length > 0) {
        const setQuery = Object.keys(tenantFields)
          .map((key, index) => `${key} = $${index + 1}`)
          .join(', ');

        const tenantRes = await client.query(
          `UPDATE tenants
           SET ${setQuery}, fecha_actualizacion = NOW()
           WHERE tenant_id = $${Object.keys(tenantFields).length + 1}
           RETURNING *`,
          [...Object.values(tenantFields), id]
        );
        updatedTenant = tenantRes.rows[0];
      }

      // Update contact data if there are contact fields
      if (Object.keys(contactFields).length > 0) {
        const setQuery = Object.keys(contactFields)
          .map((key, index) => `${key} = $${index + 1}`)
          .join(', ');

        const contactRes = await client.query(
          `UPDATE datos_contacto
           SET ${setQuery}
           WHERE tenant_id = $${Object.keys(contactFields).length + 1}
           RETURNING *`,
          [...Object.values(contactFields), id]
        );
        updatedContact = contactRes.rows[0];
      }

      await client.query('COMMIT');

      return {
        ...(updatedTenant || {}),
        ...(updatedContact || {})
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
        horario_apertura,
        horario_cierre,
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

  // Método para obtener el email de un tenant específico
  async getEmailByTenantId(tenantId) {
    try {
      const res = await pool.query(
        `SELECT dc.email 
         FROM datos_contacto dc
         INNER JOIN tenants t ON t.tenant_id = dc.tenant_id
         WHERE t.tenant_id = $1 AND t.estado = 'activo'`,
        [tenantId]
      );

      if (res.rows.length === 0) {
        return { 
          success: false, 
          error: 'Tenant no encontrado o inactivo' 
        };
      }

      const email = res.rows[0].email;

      if (!email) {
        return { 
          success: false, 
          error: 'El tenant no tiene email configurado' 
        };
      }

      return { 
        success: true, 
        email: email 
      };

    } catch (error) {
      console.error('Error consultando email del tenant:', error);
      return { 
        success: false, 
        error: 'Error interno consultando tenant' 
      };
    }
  },
};

module.exports = TenantModel;
