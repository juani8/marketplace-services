const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const pool = require('./config/db_connection');

const app = express();

// Middlewares
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Ruta para verificar el estado del backend
app.get('/status', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'Backend y base de datos funcionando correctamente',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    console.error('Error al verificar el estado del backend:', error);
    res.status(500).json({ error: 'Error al verificar el estado del backend' });
  }
});

// Rutas
// app.use('/api/ejemplo', ejemploRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo salió mal!' });
});

pool.query('SELECT NOW()')
module.exports = app;
