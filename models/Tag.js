const pool = require('../config/db');
const {
  randomPublicCode,
  randomActivationCode
} = require('../services/codes');

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM tags WHERE id=$1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function findByActivationCode(code) {
  const { rows } = await pool.query(
    'SELECT * FROM tags WHERE UPPER(activation_code)=UPPER($1) LIMIT 1',
    [code]
  );
  return rows[0] || null;
}

async function findPublic(code) {
  const { rows } = await pool.query(
    `SELECT
       t.id AS tag_id, t.public_code, t.status,
       p.*,
       c.name AS contact_name, c.relationship, c.phone, c.whatsapp
     FROM tags t
     JOIN pets p ON p.id = t.pet_id
     LEFT JOIN LATERAL (
       SELECT *
       FROM pet_contacts pc
       WHERE pc.pet_id = p.id
       ORDER BY pc.priority ASC, pc.created_at ASC
       LIMIT 1
     ) c ON true
     WHERE t.public_code=$1 AND t.status='active'
     LIMIT 1`,
    [code]
  );
  return rows[0] || null;
}

async function listByPet(petId) {
  const { rows } = await pool.query(
    'SELECT * FROM tags WHERE pet_id=$1 ORDER BY created_at DESC',
    [petId]
  );
  return rows;
}

async function activeByUser(userId) {
  const { rows } = await pool.query(
    `SELECT t.*
     FROM tags t
     JOIN pets p ON p.id = t.pet_id
     WHERE p.user_id = $1 AND t.status = 'active'
     ORDER BY t.activated_at DESC NULLS LAST, t.created_at DESC`,
    [userId]
  );

  return rows;
}

/**
 * Reserva uma plaquinha nova com sua URL pública definitiva.
 * A geração acontece exclusivamente no backend.
 */
async function createBlank() {
  const maxAttempts = 8;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const activationCode = randomActivationCode();
    const publicCode = randomPublicCode();

    try {
      const { rows } = await pool.query(
        `INSERT INTO tags (activation_code, public_code, status)
         VALUES ($1, $2, 'inactive')
         RETURNING *`,
        [activationCode, publicCode]
      );

      return rows[0];
    } catch (err) {
      // PostgreSQL unique_violation: uma colisão extremamente improvável.
      if (err.code !== '23505') {
        throw err;
      }
    }
  }

  throw new Error('Não foi possível gerar um código único para a plaquinha.');
}

/**
 * Ativa uma plaquinha previamente reservada pelo servidor.
 * El navegador NO decide ni activation_code ni public_code.
 */
async function activateReserved({ tagId, petId, userId }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const owned = await client.query(
      'SELECT id, name FROM pets WHERE id=$1 AND user_id=$2 FOR UPDATE',
      [petId, userId]
    );

    if (!owned.rowCount) {
      throw new Error('Pet não encontrado.');
    }

    const reserved = await client.query(
      'SELECT * FROM tags WHERE id=$1 FOR UPDATE',
      [tagId]
    );

    if (!reserved.rowCount) {
      throw new Error('A plaquinha reservada não está mais disponível. Recarregue a página.');
    }

    const newTag = reserved.rows[0];

    if (newTag.status !== 'inactive') {
      throw new Error('A nova plaquinha não está mais disponível para ativação. Recarregue a página.');
    }

    if (newTag.pet_id) {
      throw new Error('A nova plaquinha já está vinculada a outro pet.');
    }

    if (!newTag.public_code) {
      throw new Error('A plaquinha reservada não possui código público. Recarregue a página.');
    }

    const previous = await client.query(
      `SELECT * FROM tags
       WHERE pet_id=$1 AND status='active' AND id<>$2
       ORDER BY activated_at DESC NULLS LAST, created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [petId, newTag.id]
    );

    const previousTag = previous.rows[0] || null;

    if (previousTag) {
      await client.query(
        `UPDATE tags
         SET status='disabled', updated_at=now()
         WHERE id=$1`,
        [previousTag.id]
      );
    }

    const result = await client.query(
      `UPDATE tags
       SET pet_id=$1,
           status='active',
           activated_at=now(),
           updated_at=now()
       WHERE id=$2
       RETURNING *`,
      [petId, newTag.id]
    );

    await client.query('COMMIT');

    return {
      tag: result.rows[0],
      replaced: Boolean(previousTag),
      previousTag
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  findById,
  findByActivationCode,
  findPublic,
  listByPet,
  activeByUser,
  createBlank,
  activateReserved
};
