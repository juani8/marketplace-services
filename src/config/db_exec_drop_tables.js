const fs = require('fs');
const path = require('path');
const pool = require('./db_connection');

const dropTables = async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'db_drop_tables.sql')).toString();
    await pool.query(sql);
    console.log('✅ Tablas eliminadas correctamente.');

    // Consultar tablas restantes
    const { rows } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `);

    if (rows.length === 0) {
      console.log('No quedan tablas en la base de datos.');
    } else {
      console.log('Tablas restantes:');
      rows.forEach(({ table_name }) => console.log(`- ${table_name}`));
    }
  } catch (error) {
    console.error('❌ Error al eliminar tablas:', error);
  } finally {
    await pool.end();
  }
};

dropTables();
