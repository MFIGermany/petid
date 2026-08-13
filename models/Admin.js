const pool = require('../config/db');

function cleanSearch(value) {
  return String(value || '').trim().slice(0, 120);
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function dashboardStats() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS clients,
      (SELECT COUNT(*)::int FROM pets) AS pets,
      (SELECT COUNT(*)::int FROM pets WHERE is_lost = true) AS lost_pets,
      (SELECT COUNT(*)::int FROM tags WHERE activated_at IS NOT NULL) AS sold_tags,
      (SELECT COUNT(*)::int FROM tags WHERE status = 'active') AS active_tags,
      (SELECT COUNT(*)::int FROM tag_scans
        WHERE created_at >= date_trunc('month', now())) AS scans_this_month,
      (SELECT COUNT(*)::int
        FROM users u
        WHERE EXISTS (SELECT 1 FROM pets p WHERE p.user_id = u.id)
          AND NOT EXISTS (
            SELECT 1
            FROM pets p2
            JOIN tags t ON t.pet_id = p2.id AND t.status = 'active'
            WHERE p2.user_id = u.id
          )) AS clients_without_active_tag,
      (SELECT COUNT(*)::int FROM users
        WHERE created_at >= date_trunc('month', now())) AS new_clients_this_month
  `);

  return rows[0];
}

async function recentClients(limit = 6) {
  const safeLimit = Math.min(20, positiveInteger(limit, 6));
  const { rows } = await pool.query(`
    SELECT
      u.id, u.name, u.email, u.phone, u.created_at,
      (SELECT COUNT(*)::int FROM pets p WHERE p.user_id = u.id) AS pet_count,
      (SELECT COUNT(*)::int
        FROM tags t
        JOIN pets p ON p.id = t.pet_id
        WHERE p.user_id = u.id AND t.status = 'active') AS active_tag_count
    FROM users u
    ORDER BY u.created_at DESC
    LIMIT $1
  `, [safeLimit]);

  return rows;
}

async function lostPets(limit = 8) {
  const safeLimit = Math.min(30, positiveInteger(limit, 8));
  const { rows } = await pool.query(`
    SELECT
      p.id, p.name, p.species, p.photo_url, p.updated_at,
      u.id AS user_id, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
      (
        SELECT t.public_code
        FROM tags t
        WHERE t.pet_id = p.id AND t.status = 'active'
        ORDER BY t.activated_at DESC NULLS LAST, t.created_at DESC
        LIMIT 1
      ) AS public_code
    FROM pets p
    JOIN users u ON u.id = p.user_id
    WHERE p.is_lost = true
    ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC
    LIMIT $1
  `, [safeLimit]);

  return rows;
}

async function listClients({ query = '', page = 1, pageSize = 15 } = {}) {
  const q = cleanSearch(query);
  const safePageSize = Math.min(50, positiveInteger(pageSize, 15));
  const requestedPage = positiveInteger(page, 1);
  const like = `%${q}%`;

  const countResult = await pool.query(`
    SELECT COUNT(*)::int AS total
    FROM users u
    WHERE $1 = ''
      OR u.name ILIKE $2
      OR u.email ILIKE $2
      OR COALESCE(u.phone, '') ILIKE $2
      OR EXISTS (
        SELECT 1 FROM pets p
        WHERE p.user_id = u.id AND p.name ILIKE $2
      )
  `, [q, like]);

  const total = Number(countResult.rows[0]?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(requestedPage, totalPages);
  const offset = (safePage - 1) * safePageSize;

  const { rows } = await pool.query(`
    SELECT
      u.id, u.name, u.email, u.phone, u.created_at,
      (SELECT COUNT(*)::int FROM pets p WHERE p.user_id = u.id) AS pet_count,
      (SELECT COUNT(*)::int FROM pets p WHERE p.user_id = u.id AND p.is_lost = true) AS lost_pet_count,
      (SELECT COUNT(*)::int
        FROM tags t
        JOIN pets p ON p.id = t.pet_id
        WHERE p.user_id = u.id AND t.status = 'active') AS active_tag_count,
      (SELECT COUNT(*)::int
        FROM tags t
        JOIN pets p ON p.id = t.pet_id
        WHERE p.user_id = u.id AND t.activated_at IS NOT NULL) AS sold_tag_count,
      (SELECT COUNT(s.id)::int
        FROM tag_scans s
        JOIN tags t ON t.id = s.tag_id
        JOIN pets p ON p.id = t.pet_id
        WHERE p.user_id = u.id) AS scan_count
    FROM users u
    WHERE $1 = ''
      OR u.name ILIKE $2
      OR u.email ILIKE $2
      OR COALESCE(u.phone, '') ILIKE $2
      OR EXISTS (
        SELECT 1 FROM pets p
        WHERE p.user_id = u.id AND p.name ILIKE $2
      )
    ORDER BY u.created_at DESC, u.name ASC
    LIMIT $3 OFFSET $4
  `, [q, like, safePageSize, offset]);

  return {
    clients: rows,
    query: q,
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages
  };
}

async function clientSummary(userId) {
  const { rows } = await pool.query(`
    SELECT
      u.id, u.name, u.email, u.phone, u.created_at,
      (SELECT COUNT(*)::int FROM pets p WHERE p.user_id = u.id) AS pet_count,
      (SELECT COUNT(*)::int FROM pets p WHERE p.user_id = u.id AND p.is_lost = true) AS lost_pet_count,
      (SELECT COUNT(*)::int
        FROM tags t JOIN pets p ON p.id=t.pet_id
        WHERE p.user_id=u.id AND t.status='active') AS active_tag_count,
      (SELECT COUNT(*)::int
        FROM tags t JOIN pets p ON p.id=t.pet_id
        WHERE p.user_id=u.id AND t.activated_at IS NOT NULL) AS sold_tag_count,
      (SELECT COUNT(*)::int
        FROM tag_scans s
        JOIN tags t ON t.id=s.tag_id
        JOIN pets p ON p.id=t.pet_id
        WHERE p.user_id=u.id) AS scan_count
    FROM users u
    WHERE u.id=$1
    LIMIT 1
  `, [userId]);

  return rows[0] || null;
}

async function clientPets(userId) {
  const { rows } = await pool.query(`
    SELECT
      p.*,
      c.name AS contact_name,
      c.relationship AS contact_relationship,
      c.phone AS contact_phone,
      c.whatsapp AS contact_whatsapp,
      (
        SELECT t.public_code
        FROM tags t
        WHERE t.pet_id=p.id AND t.status='active'
        ORDER BY t.activated_at DESC NULLS LAST, t.created_at DESC
        LIMIT 1
      ) AS active_public_code,
      (SELECT COUNT(*)::int FROM tags t WHERE t.pet_id=p.id) AS tag_count,
      (SELECT COUNT(*)::int
        FROM tag_scans s JOIN tags t ON t.id=s.tag_id
        WHERE t.pet_id=p.id) AS scan_count,
      (SELECT COUNT(*)::int
        FROM tag_scans s JOIN tags t ON t.id=s.tag_id
        WHERE t.pet_id=p.id
          AND s.created_at >= date_trunc('month', now())) AS scans_this_month
    FROM pets p
    LEFT JOIN LATERAL (
      SELECT pc.*
      FROM pet_contacts pc
      WHERE pc.pet_id=p.id
      ORDER BY pc.priority ASC, pc.created_at ASC
      LIMIT 1
    ) c ON true
    WHERE p.user_id=$1
    ORDER BY p.created_at DESC
  `, [userId]);

  return rows;
}

async function contactsForClient(userId) {
  const { rows } = await pool.query(`
    SELECT pc.*
    FROM pet_contacts pc
    JOIN pets p ON p.id=pc.pet_id
    WHERE p.user_id=$1
    ORDER BY pc.pet_id, pc.priority ASC, pc.created_at ASC
  `, [userId]);
  return rows;
}

async function tagsForClient(userId) {
  const { rows } = await pool.query(`
    SELECT
      t.*,
      p.name AS pet_name,
      (SELECT COUNT(*)::int FROM tag_scans s WHERE s.tag_id=t.id) AS scan_count,
      (SELECT COUNT(*)::int FROM tag_scans s
        WHERE s.tag_id=t.id
          AND s.created_at >= date_trunc('month', now())) AS scans_this_month
    FROM tags t
    JOIN pets p ON p.id=t.pet_id
    WHERE p.user_id=$1
    ORDER BY p.created_at DESC, t.created_at DESC
  `, [userId]);
  return rows;
}

async function recentScansForClient(userId, limit = 20) {
  const safeLimit = Math.min(100, positiveInteger(limit, 20));
  const { rows } = await pool.query(`
    SELECT
      s.id, s.source, s.ip_address, s.user_agent, s.created_at,
      t.id AS tag_id, t.public_code,
      p.id AS pet_id, p.name AS pet_name
    FROM tag_scans s
    JOIN tags t ON t.id=s.tag_id
    JOIN pets p ON p.id=t.pet_id
    WHERE p.user_id=$1
    ORDER BY s.created_at DESC
    LIMIT $2
  `, [userId, safeLimit]);
  return rows;
}

async function getClientDetails(userId) {
  const client = await clientSummary(userId);
  if (!client) return null;

  const [pets, contacts, tags, scans] = await Promise.all([
    clientPets(userId),
    contactsForClient(userId),
    tagsForClient(userId),
    recentScansForClient(userId)
  ]);

  return { client, pets, contacts, tags, scans };
}

async function updateClient(userId, { name, email, phone }) {
  const { rows } = await pool.query(`
    UPDATE users
    SET name=$1, email=LOWER($2), phone=$3
    WHERE id=$4
    RETURNING id, name, email, phone, created_at
  `, [name, email, phone || null, userId]);

  return rows[0] || null;
}

async function togglePetLost(petId) {
  const { rows } = await pool.query(`
    UPDATE pets
    SET is_lost = NOT is_lost, updated_at=now()
    WHERE id=$1
    RETURNING id, user_id, name, is_lost
  `, [petId]);

  return rows[0] || null;
}

async function toggleTagStatus(tagId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const currentResult = await client.query(`
      SELECT t.*, p.user_id, p.name AS pet_name
      FROM tags t
      LEFT JOIN pets p ON p.id=t.pet_id
      WHERE t.id=$1
      FOR UPDATE OF t
    `, [tagId]);

    const current = currentResult.rows[0];
    if (!current) throw new Error('Plaquinha não encontrada.');
    if (!current.pet_id) throw new Error('Esta plaquinha ainda não está vinculada a um pet.');

    let updated;

    if (current.status === 'active') {
      const result = await client.query(`
        UPDATE tags
        SET status='disabled', updated_at=now()
        WHERE id=$1
        RETURNING *
      `, [tagId]);
      updated = result.rows[0];
    } else if (current.status === 'disabled') {
      await client.query(`
        UPDATE tags
        SET status='disabled', updated_at=now()
        WHERE pet_id=$1 AND status='active' AND id<>$2
      `, [current.pet_id, tagId]);

      const result = await client.query(`
        UPDATE tags
        SET status='active', activated_at=COALESCE(activated_at, now()), updated_at=now()
        WHERE id=$1
        RETURNING *
      `, [tagId]);
      updated = result.rows[0];
    } else {
      throw new Error('A plaquinha ainda está em estoque e não pode ser ativada por este fluxo.');
    }

    await client.query('COMMIT');
    return { ...updated, user_id: current.user_id, pet_name: current.pet_name };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteClient(userId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      'SELECT id, name, email FROM users WHERE id=$1 FOR UPDATE',
      [userId]
    );

    const user = userResult.rows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return null;
    }

    const photoResult = await client.query(
      'SELECT photo_url FROM pets WHERE user_id=$1 AND photo_url IS NOT NULL',
      [userId]
    );

    await client.query(`
      UPDATE tags
      SET status='disabled', pet_id=NULL, updated_at=now()
      WHERE pet_id IN (SELECT id FROM pets WHERE user_id=$1)
    `, [userId]);

    await client.query(`
      DELETE FROM pet_contacts
      WHERE pet_id IN (SELECT id FROM pets WHERE user_id=$1)
    `, [userId]);

    await client.query('DELETE FROM pets WHERE user_id=$1', [userId]);
    await client.query('DELETE FROM users WHERE id=$1', [userId]);

    await client.query('COMMIT');

    return {
      user,
      photoUrls: photoResult.rows.map(row => row.photo_url).filter(Boolean)
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  dashboardStats,
  recentClients,
  lostPets,
  listClients,
  getClientDetails,
  updateClient,
  togglePetLost,
  toggleTagStatus,
  deleteClient
};
