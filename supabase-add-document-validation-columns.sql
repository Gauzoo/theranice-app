-- ====================================
-- Ajouter les colonnes de validation par document
-- ====================================

-- Ajouter les statuts de validation pour chaque document
-- Valeurs possibles: NULL (pas uploadé), 'pending' (en attente), 'approved' (validé), 'rejected' (refusé)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS carte_identite_status text,
ADD COLUMN IF NOT EXISTS kbis_status text,
ADD COLUMN IF NOT EXISTS carte_identite_rejection_notes text,
ADD COLUMN IF NOT EXISTS kbis_rejection_notes text;

-- Ajouter des contraintes pour s'assurer que les statuts sont valides
ALTER TABLE public.profiles
ADD CONSTRAINT carte_identite_status_check 
CHECK (carte_identite_status IS NULL OR carte_identite_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.profiles
ADD CONSTRAINT kbis_status_check 
CHECK (kbis_status IS NULL OR kbis_status IN ('pending', 'approved', 'rejected'));

-- Mettre à jour les documents existants avec le statut 'pending' s'ils ont une URL
UPDATE public.profiles
SET carte_identite_status = 'pending'
WHERE carte_identite_url IS NOT NULL AND carte_identite_url != ''
  AND carte_identite_status IS NULL;

UPDATE public.profiles
SET kbis_status = 'pending'
WHERE kbis_url IS NOT NULL AND kbis_url != ''
  AND kbis_status IS NULL;

-- Vérifier les colonnes ajoutées
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('carte_identite_status', 'kbis_status', 'carte_identite_rejection_notes', 'kbis_rejection_notes')
ORDER BY column_name;
