const pool = require('../config/db');

async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, name, email, phone, created_at FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function create({ name, email, passwordHash, phone = null }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, phone)
     VALUES ($1, LOWER($2), $3, $4)
     RETURNING id, name, email, phone, created_at`,
    [name, email, passwordHash, phone]
  );
  return rows[0];
}

module.exports = { findByEmail, findById, create };
