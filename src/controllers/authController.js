const pool = require('../config/db_connection');
const bcrypt = require('bcrypt');
const UserModel = require('../models/user.model');
const JWTService = require('../services/jwtService');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario con todos los detalles para JWT
    const userWithDetails = await UserModel.findByEmailWithDetails(email);
    
    if (!userWithDetails) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña (descomenta cuando tengas las contraseñas hasheadas)
    const validPassword = await UserModel.verifyPassword(password, userWithDetails.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar tokens JWT
    const tokens = JWTService.generateTokens(userWithDetails);

    // Respuesta en el formato original + tokens
    res.json({
      message: 'Login exitoso',
      user: {
        usuario_id: userWithDetails.usuario_id,
        tenant_id: userWithDetails.tenant_id,
        nombre: userWithDetails.nombre,
        email: userWithDetails.email,
        rol: userWithDetails.rol
      },
      // Agregar tokens JWT
      tokens: tokens
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

    // Obtener usuario completo para generar tokens JWT
    const completeUser = await UserModel.findByEmailWithDetails(email);
    const tokens = JWTService.generateTokens(completeUser);

    // Respuesta en formato original + tokens
    res.status(201).json({
      message: 'Tenant y usuario creados correctamente',
      user: userResult.rows[0],
      tenant_id: tenantId,
      // Agregar tokens JWT
      tokens: tokens
    });
  } catch (error) {
    console.error('Error al registrar tenant:', error);
    res.status(500).json({ message: 'Error al registrar tenant' });
  }
};

const registerInternalUser = async (req, res) => {
  const { nombre, email, password, rol, comercios_ids } = req.body;

  try {
    // Verificar que el usuario autenticado sea admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Solo administradores pueden crear usuarios internos' 
      });
    }

    // Usar tenant_id del JWT en lugar del body
    const tenant_id = req.user.tenant_id;

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

    // Obtener usuario completo para generar tokens JWT
    const completeUser = await UserModel.findByEmailWithDetails(email);
    const tokens = JWTService.generateTokens(completeUser);

    // Respuesta en formato original + tokens
    res.status(201).json({ 
      message: 'Usuario creado exitosamente', 
      usuario_id,
      // Agregar tokens JWT
      tokens: tokens
    });
  } catch (error) {
    console.error('Error al registrar usuario interno:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Nuevos endpoints JWT adicionales (sin cambiar los existentes)
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    // Verificar refresh token
    const decoded = JWTService.verifyRefreshToken(refreshToken);

    // Obtener usuario actualizado
    const user = await UserModel.findByIdWithDetails(decoded.usuario_id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el tenant esté activo
    if (user.tenant_estado !== 'activo') {
      return res.status(403).json({
        success: false,
        message: 'Cuenta suspendida. Contacta al administrador'
      });
    }

    // Generar nuevos tokens
    const tokens = JWTService.generateTokens(user);

    res.json({
      success: true,
      message: 'Tokens renovados exitosamente',
      tokens: tokens
    });

  } catch (error) {
    console.error('Error en refreshToken:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh token inválido o expirado'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    // El usuario viene del middleware de autenticación
    const user = await UserModel.findByIdWithDetails(req.user.usuario_id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const userResponse = {
      usuario_id: user.usuario_id,
      tenant_id: user.tenant_id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      tenant: {
        nombre: user.tenant_nombre,
        razon_social: user.razon_social,
        estado: user.tenant_estado
      },
      comercios: user.comercios || []
    };

    res.json({
      success: true,
      data: userResponse
    });

  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = { 
  login, 
  registerTenant, 
  registerInternalUser,
  refreshToken,
  getProfile
};