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

const registerInternalUser = async (req, res) => {
  const { tenant_id, nombre, email, password, rol, comercios_ids } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertamos el usuario
    const result = await pool.query(
      `INSERT INTO usuarios_tenant (tenant_id, nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING usuario_id`,
      [tenant_id, nombre, email, hashedPassword, rol]
    );

    const usuario_id = result.rows[0].usuario_id;

    // Ahora asociamos al usuario a los comercios según su rol
    let comercios;

    if (rol === 'admin') {
      // Asociar a todos los comercios del tenant
      const comerciosResult = await pool.query(
        `SELECT comercio_id FROM comercios WHERE tenant_id = $1`,
        [tenant_id]
      );
      comercios = comerciosResult.rows.map(row => row.comercio_id);
    } else if (rol === 'operador') {
      // Asociar solo a los comercios recibidos por parámetro
      comercios = comercios_ids;
    } else {
      return res.status(400).json({ message: 'Rol no válido' });
    }

    // Insertar en usuario_comercio
    for (const comercio_id of comercios) {
      await pool.query(
        `INSERT INTO usuario_comercio (usuario_id, comercio_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [usuario_id, comercio_id]
      );
    }

    res.status(201).json({ message: 'Usuario creado exitosamente', usuario_id });
  } catch (error) {
    console.error('Error al registrar usuario interno:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { login, registerTenant, registerInternalUser };