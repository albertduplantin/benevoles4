-- Limitation des demandes de lien de connexion
CREATE TABLE IF NOT EXISTS login_attempts (
  id text PRIMARY KEY,
  email text NOT NULL,
  ip text,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_email_idx ON login_attempts (email, created_at DESC);
CREATE INDEX IF NOT EXISTS login_attempts_ip_idx ON login_attempts (ip, created_at DESC);

-- Rappels de mission déjà envoyés
CREATE TABLE IF NOT EXISTS reminders (
  mission_id text NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (mission_id, user_id)
);

-- Pointage le jour J
CREATE TABLE IF NOT EXISTS attendance (
  mission_id text NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  present boolean NOT NULL,
  marked_by text NOT NULL,
  marked_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (mission_id, user_id)
);
