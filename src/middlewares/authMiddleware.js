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
const requireAdmin = (req, res, next) => {
  try {
    // Verificar que ya se ejecutó authenticateToken
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Se requiere autenticación JWT' 
      });
    }

    // Verificar que el usuario es admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Acceso denegado. Solo administradores pueden realizar esta operación' 
      });
    }

    next();

  } catch (error) {
    console.error('Error en middleware requireAdmin:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin
}; 