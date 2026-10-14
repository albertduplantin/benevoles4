-- Migration Clerk -> Auth.js (à exécuter une seule fois sur la base Neon)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE users ALTER COLUMN first_name SET DEFAULT '';
ALTER TABLE users ALTER COLUMN last_name SET DEFAULT '';
ALTER TABLE users ALTER COLUMN phone SET DEFAULT '';

-- Les emails existants sont considérés comme vérifiés (comptes créés via Clerk)
UPDATE users SET email_verified = now() WHERE email_verified IS NULL AND email_only IS NOT TRUE;

-- Unicité de l'email (échoue s'il existe des doublons : les corriger avant)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));

CREATE TABLE IF NOT EXISTS accounts (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  PRIMARY KEY (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamp NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Données migrées depuis Firestore
CREATE TABLE IF NOT EXISTS mission_categories (
  id text PRIMARY KEY,
  value text NOT NULL,
  label text NOT NULL,
  group_name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_by text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp
);

CREATE TABLE IF NOT EXISTS admin_settings (
  id text PRIMARY KEY,
  auto_approve_responsibility boolean NOT NULL DEFAULT false,
  festival_start_date timestamp,
  festival_end_date timestamp,
  registrations_blocked boolean NOT NULL DEFAULT false,
  registration_blocked_message text DEFAULT '',
  updated_at timestamp,
  updated_by text
);

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  mission_id text,
  mission_title text,
  volunteer_name text,
  volunteer_id text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  read_at timestamp
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS missions_volunteers_idx ON missions USING gin (volunteers);
CREATE INDEX IF NOT EXISTS category_responsibles_responsible_idx ON category_responsibles (responsible_id);
CREATE INDEX IF NOT EXISTS category_responsibles_category_idx ON category_responsibles (category_id);
