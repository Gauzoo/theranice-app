-- Ajouter la colonne payment_intent_id à la table bookings
-- Cette colonne permet de lier une réservation à un paiement Stripe

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Créer un index pour améliorer les performances des requêtes sur payment_intent_id
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent 
ON bookings(payment_intent_id);

-- Commentaire sur la colonne
COMMENT ON COLUMN bookings.payment_intent_id IS 'ID du paiement Stripe (payment_intent)';
