-- ============================================================
-- MIGRATION : Intégration Nuki Smart Lock (Keypad 2.0)
-- ============================================================
-- Ajoute les colonnes nécessaires pour stocker les codes d'accès
-- générés via l'API Nuki Web et associés à chaque réservation.
-- ============================================================

-- 1. Ajout des colonnes sur la table bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS access_code TEXT,
  ADD COLUMN IF NOT EXISTS nuki_auth_id TEXT,
  ADD COLUMN IF NOT EXISTS nuki_code_status TEXT DEFAULT 'none';

-- access_code     : Le code PIN 6 chiffres pour le keypad Nuki
-- nuki_auth_id    : L'ID de l'autorisation Nuki (pour suppression/révocation)
-- nuki_code_status: L'état du code Nuki (none, creating, active, expired, error, revoked)

-- 2. Index pour retrouver rapidement les codes actifs (nettoyage)
CREATE INDEX IF NOT EXISTS idx_bookings_nuki_code_status
  ON bookings(nuki_code_status)
  WHERE nuki_code_status IN ('active', 'creating');

-- 3. Index pour vérifier l'unicité des codes actifs
CREATE INDEX IF NOT EXISTS idx_bookings_access_code_active
  ON bookings(access_code)
  WHERE access_code IS NOT NULL AND nuki_code_status = 'active';

-- ============================================================
-- IMPORTANT : Exécutez ce script dans l'éditeur SQL de Supabase
-- Dashboard > SQL Editor > New Query > Coller > Run
-- ============================================================
