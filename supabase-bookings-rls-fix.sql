-- Fix RLS policies for bookings table
-- Permet à tous les utilisateurs authentifiés de voir toutes les réservations (pour afficher les créneaux occupés)
-- Mais seulement de modifier/supprimer leurs propres réservations

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;

-- Politique de LECTURE : Tous les utilisateurs authentifiés peuvent voir toutes les réservations
-- (nécessaire pour afficher les créneaux déjà réservés dans le calendrier)
CREATE POLICY "Users can view all bookings"
ON bookings
FOR SELECT
TO authenticated
USING (true);

-- Politique d'INSERTION : Les utilisateurs peuvent créer leurs propres réservations
CREATE POLICY "Users can insert their own bookings"
ON bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Politique de MISE À JOUR : Les utilisateurs peuvent modifier leurs propres réservations
CREATE POLICY "Users can update their own bookings"
ON bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Politique de SUPPRESSION : Les utilisateurs peuvent supprimer leurs propres réservations
CREATE POLICY "Users can delete their own bookings"
ON bookings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
