const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const pool = require('./config/db_connection');

// Rutas
const tenantRoutes = require('./routes/tenantRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const categoriesRoutes = require('./routes/categoriesRoutes');
const productRoutes = require('./routes/productRoutes');
const promotionsRoutes = require('./routes/promotionsRoutes');
const authRoutes = require('./routes/authRoutes');
const { getCallback, postCallback } = require('./controllers/callbackController');
const callbackRoutes = require('./routes/callbackRoutes');

const app = express();

// ✅ CORS antes que nada
app.use(cors({
  origin: ['https://marketplace.deliver.com', 'http://localhost:5173'],
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());

// Rutas raíz para el hub de eventos
app.get('/', getCallback);  // Verificación de suscripción
app.post('/', postCallback); // Recepción de eventos

// Rutas
app.use('/api/tenants', tenantRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/auth', authRoutes);

// Rutas alternativas de callback (por si acaso)
app.use('/callback', callbackRoutes);

// Endpoint de test
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

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo salió mal!' });
});

// ✅ Esto es importante para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
