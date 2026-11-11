-- Interrupteur « suspendre les notifications aux bénévoles » + suivi des affectations déjà notifiées.
-- Migration uniquement additive : rien n'est supprimé ni modifié dans les données existantes.

ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS notifications_paused boolean NOT NULL DEFAULT false;

-- (mission, bénévole) pour lesquels le bénévole a déjà été prévenu de son inscription
CREATE TABLE IF NOT EXISTS assignment_notices (
  mission_id text NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notified_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (mission_id, user_id)
);

-- Tout ce qui est déjà affecté est considéré comme déjà notifié (les emails sont partis au moment de l'affectation)
INSERT INTO assignment_notices (mission_id, user_id)
SELECT m.id, v
FROM missions m, unnest(m.volunteers) AS v
WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = v)
ON CONFLICT DO NOTHING;

-- Au déploiement, les notifications démarrent en pause (choix de l'administrateur)
UPDATE admin_settings SET notifications_paused = true WHERE id = 'admin';
