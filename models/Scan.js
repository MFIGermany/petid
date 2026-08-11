const pool = require('../config/db');

async function log({ tagId, ipAddress, userAgent, source = 'unknown' }) {
  try {
    await pool.query(
      `INSERT INTO tag_scans (tag_id, ip_address, user_agent, source)
       VALUES ($1,$2,$3,$4)`,
      [tagId, ipAddress || null, userAgent || null, source]
    );
  } catch (err) {
    console.error('No se pudo registrar lectura del tag:', err.message);
  }
}

module.exports = { log };
