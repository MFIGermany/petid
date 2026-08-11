require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'pet-photos';

let client = null;

function getClient() {
  if (!SUPABASE_URL) {
    throw new Error('Falta SUPABASE_URL no arquivo .env');
  }

  if (!SUPABASE_SECRET_KEY) {
    throw new Error('Falta SUPABASE_SECRET_KEY no arquivo .env');
  }

  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }

  return client;
}

function extensionForMime(mimetype) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };

  return map[mimetype] || null;
}

async function uploadPetPhoto(file, userId) {
  if (!file) return null;

  const extension = extensionForMime(file.mimetype);
  if (!extension) {
    throw new Error('Formato de imagem não permitido. Use JPG, PNG ou WEBP.');
  }

  const objectPath = `users/${userId}/pets/${randomUUID()}.${extension}`;
  const supabase = getClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Não foi possível enviar a foto para o Supabase Storage: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(objectPath);

  if (!data?.publicUrl) {
    await removeObject(objectPath).catch(() => {});
    throw new Error('O Supabase não retornou a URL pública da foto.');
  }

  return {
    publicUrl: data.publicUrl,
    objectPath
  };
}

async function removeObject(objectPath) {
  if (!objectPath) return;

  const supabase = getClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([objectPath]);

  if (error) {
    throw new Error(`Não foi possível excluir a foto anterior: ${error.message}`);
  }
}

function objectPathFromPublicUrl(publicUrl) {
  if (!publicUrl) return null;

  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const index = url.pathname.indexOf(marker);

    if (index === -1) return null;

    const rawPath = url.pathname.slice(index + marker.length);
    return decodeURIComponent(rawPath);
  } catch (_) {
    return null;
  }
}

async function removeByPublicUrl(publicUrl) {
  const objectPath = objectPathFromPublicUrl(publicUrl);
  if (!objectPath) return;
  await removeObject(objectPath);
}

module.exports = {
  uploadPetPhoto,
  removeObject,
  removeByPublicUrl,
  objectPathFromPublicUrl
};
