require('dotenv').config();
const pool = require('../config/db');

(async () => {
  try {
    const version = await pool.query('select version()');
    const tables = await pool.query(`
      select tablename
      from pg_tables
      where schemaname='public'
      order by tablename
    `);
    console.log('CONEXION OK');
    console.log(version.rows[0].version);
    console.log('Tablas:', tables.rows.map(r => r.tablename));
  } catch (err) {
    console.error('ERROR DE CONEXION:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
