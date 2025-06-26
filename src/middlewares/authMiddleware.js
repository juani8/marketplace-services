const pool = require('../config/db_connection');
const JWTService = require('../services/jwtService');

/**
 * Middleware para verificar JWT y autenticar usuario
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const decoded = JWTService.verifyAccessToken(token);
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Error en authenticateToken:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

// Middleware para verificar que el usuario sea administrador
const requireAdmin = async (req, res, next) => {
  try {
    // Por ahora usamos x-user-id y x-tenant-id headers
    // En el futuro esto se extraería del JWT
    const userId = req.headers['x-user-id'];
    const tenantId = req.headers['x-tenant-id'];

    if (!userId || !tenantId) {
      return res.status(401).json({ 
        success: false,
        message: 'Headers x-user-id y x-tenant-id son requeridos' 
      });
    }

    // Verificar que el usuario existe y es admin del tenant
    const userQuery = `
      SELECT usuario_id, tenant_id, nombre, email, rol
      FROM usuarios_tenant 
      WHERE usuario_id = $1 AND tenant_id = $2
    `;
    
    const userResult = await pool.query(userQuery, [userId, tenantId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario no encontrado o no pertenece al tenant' 
      });
    }

    const user = userResult.rows[0];

    if (user.rol !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Acceso denegado. Solo administradores pueden realizar esta operación' 
      });
    }

    // Agregar información del usuario al request para uso posterior
    req.user = user;
    next();

  } catch (error) {
    console.error('Error en middleware requireAdmin:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// Middleware más flexible para verificar autenticación general
const requireAuth = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const tenantId = req.headers['x-tenant-id'];

    if (!userId || !tenantId) {
      return res.status(401).json({ 
        success: false,
        message: 'Headers x-user-id y x-tenant-id son requeridos' 
      });
    }

    // Verificar que el usuario existe y pertenece al tenant
    const userQuery = `
      SELECT usuario_id, tenant_id, nombre, email, rol
      FROM usuarios_tenant 
      WHERE usuario_id = $1 AND tenant_id = $2
    `;
    
    const userResult = await pool.query(userQuery, [userId, tenantId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario no encontrado o no pertenece al tenant' 
      });
    }

    req.user = userResult.rows[0];
    next();

  } catch (error) {
    console.error('Error en middleware requireAuth:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAuth
}; 