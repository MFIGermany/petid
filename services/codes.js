const crypto = require('crypto');

const TAG_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Genera códigos legibles evitando caracteres ambiguos como I, O, 0 y 1.
 */
function randomCode(length = 10) {
  const bytes = crypto.randomBytes(length);
  let out = '';

  for (let i = 0; i < length; i += 1) {
    out += TAG_ALPHABET[bytes[i] % TAG_ALPHABET.length];
  }

  return out;
}

/**
 * Código público que fará parte da URL NFC/QR Code.
 */
function randomPublicCode() {
  return randomCode(10);
}

/**
 * Código interno de estoque/ativação. O cliente não precisa digitá-lo.
 */
function randomActivationCode() {
  return randomCode(12);
}

module.exports = {
  randomCode,
  randomPublicCode,
  randomActivationCode
};
