const jwt = require('jsonwebtoken');

const JWTService = {
  // Generar token de acceso con toda la información del usuario
  generateAccessToken(user) {
    const payload = {
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

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      issuer: 'marketplace-services',
      audience: 'marketplace-app'
    });
  },

  // Generar token de refresh
  generateRefreshToken(user) {
    const payload = {
      usuario_id: user.usuario_id,
      tenant_id: user.tenant_id,
      email: user.email
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'marketplace-services',
      audience: 'marketplace-app'
    });
  },

  // Verificar token de acceso
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'marketplace-services',
        audience: 'marketplace-app'
      });
    } catch (error) {
      throw new Error('Token de acceso inválido');
    }
  },

  // Verificar token de refresh
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: 'marketplace-services',
        audience: 'marketplace-app'
      });
    } catch (error) {
      throw new Error('Token de refresh inválido');
    }
  },

  // Generar ambos tokens
  generateTokens(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user)
    };
  }
};

module.exports = JWTService; 