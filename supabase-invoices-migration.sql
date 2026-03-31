-- Migration : Table invoices pour la facturation THÉRANICE
-- À exécuter dans le SQL Editor de Supabase

-- Table des factures
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  amount_ht NUMERIC(10, 2) NOT NULL,
  amount_ttc NUMERIC(10, 2) NOT NULL,
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_prestation DATE NOT NULL,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  room TEXT NOT NULL,
  slot TEXT NOT NULL,
  nom TEXT,
  prenom TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par numéro de facture
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- Index pour recherche par utilisateur
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);

-- Index pour recherche par booking
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);

-- RLS : les utilisateurs ne voient que leurs propres factures
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Le service role peut tout faire (utilisé par les API routes)
CREATE POLICY "Service role has full access to invoices"
  ON invoices FOR ALL
  USING (true)
  WITH CHECK (true);

-- Vérification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'invoices'
ORDER BY ordinal_position;
