const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const sqlPath = path.join(__dirname, '../db/init.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

pool.query(sql)
  .then(() => {
    console.log('✅ Base de datos inicializada correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  });
