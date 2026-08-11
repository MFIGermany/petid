-- PetID - PostgreSQL / Supabase
-- Ejecutar en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone VARCHAR(40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  species VARCHAR(60) NOT NULL,
  breed VARCHAR(120),
  sex VARCHAR(30),
  birth_date DATE,
  color VARCHAR(120),
  photo_url TEXT,
  medical_conditions TEXT,
  notes TEXT,
  is_lost BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);

CREATE TABLE IF NOT EXISTS pet_contacts (
  id BIGSERIAL PRIMARY KEY,
  pet_id BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  name VARCHAR(120),
  relationship VARCHAR(80),
  phone VARCHAR(40),
  whatsapp VARCHAR(40),
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_contacts_pet_id ON pet_contacts(pet_id);

CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  pet_id BIGINT REFERENCES pets(id) ON DELETE SET NULL,
  activation_code VARCHAR(40) NOT NULL UNIQUE,
  public_code VARCHAR(40) UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive','active','disabled')),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tags_pet_id ON tags(pet_id);
CREATE INDEX IF NOT EXISTS idx_tags_public_code ON tags(public_code);

CREATE TABLE IF NOT EXISTS tag_scans (
  id BIGSERIAL PRIMARY KEY,
  tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL DEFAULT 'unknown',
  ip_address VARCHAR(80),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tag_scans_tag_id ON tag_scans(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_scans_created_at ON tag_scans(created_at);

-- Tabla para express-session / connect-pg-simple
CREATE TABLE IF NOT EXISTS app_sessions (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  CONSTRAINT app_sessions_pkey PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS idx_app_sessions_expire ON app_sessions(expire);

-- RLS activado. La app Node se conecta directamente a PostgreSQL desde backend.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
