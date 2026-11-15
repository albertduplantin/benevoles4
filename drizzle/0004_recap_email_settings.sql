-- Objet et nom d'expéditeur personnalisables pour l'email « récapitulatif des missions ».
-- Migration uniquement additive : deux colonnes facultatives (vides = valeurs par défaut).

ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS recap_subject text;
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS recap_sender_name text;
