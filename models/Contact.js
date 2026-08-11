const pool = require('../config/db');

async function primaryForPet(petId) {
  const { rows } = await pool.query(
    `SELECT * FROM pet_contacts
     WHERE pet_id=$1
     ORDER BY priority ASC, created_at ASC
     LIMIT 1`,
    [petId]
  );
  return rows[0] || null;
}

async function upsertPrimary(petId, data) {
  const existing = await primaryForPet(petId);
  if (existing) {
    const { rows } = await pool.query(
      `UPDATE pet_contacts
       SET name=$1, relationship=$2, phone=$3, whatsapp=$4, priority=1, updated_at=now()
       WHERE id=$5
       RETURNING *`,
      [
        data.contact_name || null,
        data.relationship || 'Tutor',
        data.phone || null,
        data.whatsapp || data.phone || null,
        existing.id
      ]
    );
    return rows[0];
  }

  const { rows } = await pool.query(
    `INSERT INTO pet_contacts (pet_id, name, relationship, phone, whatsapp, priority)
     VALUES ($1,$2,$3,$4,$5,1)
     RETURNING *`,
    [
      petId,
      data.contact_name || null,
      data.relationship || 'Tutor',
      data.phone || null,
      data.whatsapp || data.phone || null
    ]
  );
  return rows[0];
}

module.exports = { primaryForPet, upsertPrimary };
