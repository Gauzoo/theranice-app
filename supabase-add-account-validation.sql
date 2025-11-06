-- ====================================
-- Script SQL pour ajouter la validation de compte
-- À exécuter dans Supabase SQL Editor
-- ====================================

-- 1. Ajouter les nouvelles colonnes dans la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS activite_exercee TEXT,
ADD COLUMN IF NOT EXISTS carte_identite_url TEXT,
ADD COLUMN IF NOT EXISTS kbis_url TEXT,
ADD COLUMN IF NOT EXISTS documents_submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS validation_notes TEXT;

-- 2. Ajouter une contrainte pour les valeurs possibles de account_status
ALTER TABLE profiles 
ADD CONSTRAINT check_account_status 
CHECK (account_status IN ('pending', 'documents_submitted', 'approved', 'rejected'));

-- 3. Mettre à jour les comptes existants pour qu'ils soient approuvés
-- (car ils ont déjà pu réserver, on considère qu'ils sont validés)
UPDATE profiles 
SET account_status = 'approved', 
    validated_at = NOW()
WHERE account_status = 'pending';

-- 4. Créer un index pour les recherches par statut (optimisation)
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);

-- 5. Afficher le résultat
SELECT 
    id, 
    nom, 
    prenom, 
    account_status, 
    activite_exercee,
    created_at
FROM profiles
ORDER BY created_at DESC;
