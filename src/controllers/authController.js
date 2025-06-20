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

module.exports = { login };