const pool = require('../config/db_connection');
const bcrypt = require('bcrypt');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT usuario_id, tenant_id, nombre, email, password_hash, rol FROM usuarios_tenant WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    /*const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }*/

    // A futuro, podrías generar un JWT acá
    res.json({
      message: 'Login exitoso',
      user: {
        usuario_id: user.usuario_id,
        tenant_id: user.tenant_id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const registerTenant = async (req, res) => {
  const {
    nombre_tenant,
    razon_social,
    cuenta_bancaria,
    email,
    password,
    nombre_usuario
  } = req.body;

  try {
    // Verificamos si el email ya existe
    const existingUser = await pool.query(
      'SELECT * FROM usuarios_tenant WHERE email = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    // Creamos el tenant
    const tenantResult = await pool.query(
      `INSERT INTO tenants (nombre, razon_social, cuenta_bancaria)
       VALUES ($1, $2, $3) RETURNING tenant_id`,
      [nombre_tenant, razon_social, cuenta_bancaria]
    );

    const tenantId = tenantResult.rows[0].tenant_id;

    // Hasheamos el password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creamos el usuario admin
    const userResult = await pool.query(
      `INSERT INTO usuarios_tenant (tenant_id, nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING usuario_id, nombre, email, rol`,
      [tenantId, nombre_usuario, email, hashedPassword]
    );

    res.status(201).json({
      message: 'Tenant y usuario creados correctamente',
      user: userResult.rows[0],
      tenant_id: tenantId
    });
  } catch (error) {
    console.error('Error al registrar tenant:', error);
    res.status(500).json({ message: 'Error al registrar tenant' });
  }
};

module.exports = { login, registerTenant };