const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function safeEqual(a, b) {
  const aBuffer = Buffer.from(String(a || ''), 'utf8');
  const bBuffer = Buffer.from(String(b || ''), 'utf8');

  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function config() {
  return {
    email: normalizeEmail(process.env.ADMIN_EMAIL),
    name: String(process.env.ADMIN_NAME || 'Administrador').trim() || 'Administrador',
    passwordHash: String(process.env.ADMIN_PASSWORD_HASH || '').trim(),
    password: String(process.env.ADMIN_PASSWORD || '')
  };
}

function isConfigured() {
  const current = config();
  return Boolean(current.email && (current.passwordHash || current.password));
}

async function verify(email, password) {
  const current = config();
  const normalizedEmail = normalizeEmail(email);

  if (!current.email || !normalizedEmail || !safeEqual(normalizedEmail, current.email)) {
    return null;
  }

  let validPassword = false;

  if (current.passwordHash) {
    try {
      validPassword = await bcrypt.compare(String(password || ''), current.passwordHash);
    } catch (_) {
      validPassword = false;
    }
  } else if (current.password) {
    validPassword = safeEqual(String(password || ''), current.password);
  }

  if (!validPassword) return null;

  return {
    email: current.email,
    name: current.name
  };
}

module.exports = {
  config,
  isConfigured,
  verify
};
