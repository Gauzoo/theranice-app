-- Migration : Ajout des champs adresse et siret au profil utilisateur
-- Obligatoires pour la facturation
-- À exécuter dans le SQL Editor de Supabase

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS siret TEXT;
