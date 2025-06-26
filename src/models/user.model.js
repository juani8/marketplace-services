const pool = require('../config/db_connection');
const bcrypt = require('bcryptjs');

const UserModel = {
  // Buscar usuario por email para login (con toda la información necesaria para JWT)
  async findByEmailWithDetails(email) {
    try {
      const query = `
        SELECT 
          u.usuario_id,
          u.tenant_id,
          u.nombre,
          u.email,
          u.password_hash,
          u.rol,
          t.nombre as tenant_nombre,
          t.razon_social,
          t.estado as tenant_estado,
          json_agg(
            CASE 
              WHEN c.comercio_id IS NOT NULL 
              THEN json_build_object(
                'comercio_id', c.comercio_id,
                'nombre', c.nombre,
                'calle', c.calle,
                'numero', c.numero,
                'ciudad', c.ciudad,
                'provincia', c.provincia,
                'codigo_postal', c.codigo_postal,
                'lat', c.lat,
                'lon', c.lon
              )
              ELSE NULL
            END
          ) FILTER (WHERE c.comercio_id IS NOT NULL) as comercios
        FROM usuarios_tenant u
        INNER JOIN tenants t ON u.tenant_id = t.tenant_id
        LEFT JOIN usuario_comercio uc ON u.usuario_id = uc.usuario_id
        LEFT JOIN comercios c ON uc.comercio_id = c.comercio_id
        WHERE u.email = $1
        GROUP BY 
          u.usuario_id, 
          u.tenant_id, 
          u.nombre, 
          u.email, 
          u.password_hash, 
          u.rol,
          t.nombre,
          t.razon_social,
          t.estado
      `;

      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error en findByEmailWithDetails:', error);
      throw error;
    }
  },

  // Verificar contraseña
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Obtener usuario completo por ID (para refresh token)
  async findByIdWithDetails(userId) {
    try {
      const query = `
        SELECT 
          u.usuario_id,
          u.tenant_id,
          u.nombre,
          u.email,
          u.rol,
          t.nombre as tenant_nombre,
          t.razon_social,
          t.estado as tenant_estado,
          json_agg(
            CASE 
              WHEN c.comercio_id IS NOT NULL 
              THEN json_build_object(
                'comercio_id', c.comercio_id,
                'nombre', c.nombre,
                'calle', c.calle,
                'numero', c.numero,
                'ciudad', c.ciudad,
                'provincia', c.provincia,
                'codigo_postal', c.codigo_postal,
                'lat', c.lat,
                'lon', c.lon
              )
              ELSE NULL
            END
          ) FILTER (WHERE c.comercio_id IS NOT NULL) as comercios
        FROM usuarios_tenant u
        INNER JOIN tenants t ON u.tenant_id = t.tenant_id
        LEFT JOIN usuario_comercio uc ON u.usuario_id = uc.usuario_id
        LEFT JOIN comercios c ON uc.comercio_id = c.comercio_id
        WHERE u.usuario_id = $1
        GROUP BY 
          u.usuario_id, 
          u.tenant_id, 
          u.nombre, 
          u.email, 
          u.rol,
          t.nombre,
          t.razon_social,
          t.estado
      `;

      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error en findByIdWithDetails:', error);
      throw error;
    }
  }
};

module.exports = UserModel; 