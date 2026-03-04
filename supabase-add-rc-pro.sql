-- ================================================
-- Migration : Ajout du document RC Pro (Responsabilité Civile Professionnelle)
-- À exécuter dans Supabase SQL Editor
-- ================================================

-- 1. Ajouter les colonnes RC Pro au profil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rc_pro_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rc_pro_status TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rc_pro_rejection_notes TEXT DEFAULT NULL;

-- 2. Mettre à jour la politique RLS pour permettre aux utilisateurs de modifier ces champs
-- (Les politiques existantes couvrent déjà "UPDATE" sur profiles pour l'utilisateur connecté,
--  donc les nouvelles colonnes sont automatiquement incluses)

-- 3. VÉRIFICATION : Lister les comptes existants approuvés
-- Ceux-ci devront soumettre leur RC Pro
SELECT id, nom, prenom, account_status, rc_pro_url 
FROM profiles 
WHERE account_status = 'approved';
