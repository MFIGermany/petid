const pool = require('../config/db');

async function allByUser(userId) {
  const { rows } = await pool.query(
    `SELECT p.*,
       (SELECT COUNT(*)::int FROM tags t WHERE t.pet_id = p.id AND t.status = 'active') AS active_tags,
       (SELECT COUNT(*)::int FROM tag_scans s JOIN tags t2 ON t2.id=s.tag_id WHERE t2.pet_id=p.id
          AND s.created_at >= date_trunc('month', now())) AS scans_this_month
     FROM pets p
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return rows;
}

async function findOwned(id, userId) {
  const { rows } = await pool.query(
    'SELECT * FROM pets WHERE id = $1 AND user_id = $2 LIMIT 1',
    [id, userId]
  );
  return rows[0] || null;
}

async function create(userId, data) {
  const { rows } = await pool.query(
    `INSERT INTO pets
      (user_id, name, species, breed, sex, birth_date, color, photo_url,
       medical_conditions, notes, is_lost)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false)
     RETURNING *`,
    [
      userId, data.name, data.species, data.breed || null, data.sex || null,
      data.birth_date || null, data.color || null, data.photo_url || null,
      data.medical_conditions || null, data.notes || null
    ]
  );
  return rows[0];
}

async function update(id, userId, data) {
  const { rows } = await pool.query(
    `UPDATE pets SET
       name=$1, species=$2, breed=$3, sex=$4, birth_date=$5, color=$6,
       photo_url=$7, medical_conditions=$8, notes=$9, updated_at=now()
     WHERE id=$10 AND user_id=$11
     RETURNING *`,
    [
      data.name, data.species, data.breed || null, data.sex || null,
      data.birth_date || null, data.color || null, data.photo_url || null,
      data.medical_conditions || null, data.notes || null, id, userId
    ]
  );
  return rows[0] || null;
}

async function toggleLost(id, userId) {
  const { rows } = await pool.query(
    `UPDATE pets
     SET is_lost = NOT is_lost, updated_at = now()
     WHERE id=$1 AND user_id=$2
     RETURNING *`,
    [id, userId]
  );
  return rows[0] || null;
}

async function remove(id, userId) {
  const result = await pool.query(
    'DELETE FROM pets WHERE id=$1 AND user_id=$2',
    [id, userId]
  );
  return result.rowCount > 0;
}

module.exports = { allByUser, findOwned, create, update, toggleLost, remove };
