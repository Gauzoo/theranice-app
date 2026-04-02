-- Migration: Ajout des colonnes d'audit pour les annulations de réservations
-- À exécuter dans le SQL Editor de Supabase

-- Ajouter les colonnes cancelled_at et cancelled_by à la table bookings
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);

-- Index pour faciliter les recherches par utilisateur ayant annulé
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_by ON bookings(cancelled_by) WHERE cancelled_by IS NOT NULL;
