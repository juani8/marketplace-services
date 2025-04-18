const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const pool = require('./config/db_connection');

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rutas
// app.use('/api/ejemplo', ejemploRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo salió mal!' });
});

pool.query('SELECT NOW()')
module.exports = app;
