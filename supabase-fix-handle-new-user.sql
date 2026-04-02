-- Migration: Créer/corriger le trigger handle_new_user
-- Ce trigger copie les métadonnées d'inscription (nom, prénom, adresse, SIRET, etc.)
-- depuis auth.users.raw_user_meta_data vers la table profiles.
-- À exécuter dans le SQL Editor de Supabase

-- Supprimer l'ancien trigger et la fonction s'ils existent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Créer la fonction qui copie les métadonnées vers profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    nom,
    prenom,
    telephone,
    activite_exercee,
    adresse,
    siret,
    account_status
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'telephone', ''),
    COALESCE(NEW.raw_user_meta_data->>'activite_exercee', ''),
    COALESCE(NEW.raw_user_meta_data->>'adresse', ''),
    COALESCE(NEW.raw_user_meta_data->>'siret', ''),
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Optionnel : corriger les profils existants qui ont des champs vides
-- mais dont les métadonnées auth contiennent les bonnes valeurs
UPDATE public.profiles p
SET
  nom = COALESCE(NULLIF(p.nom, ''), u.raw_user_meta_data->>'nom', p.nom),
  prenom = COALESCE(NULLIF(p.prenom, ''), u.raw_user_meta_data->>'prenom', p.prenom),
  telephone = COALESCE(NULLIF(p.telephone, ''), u.raw_user_meta_data->>'telephone', p.telephone),
  activite_exercee = COALESCE(NULLIF(p.activite_exercee, ''), u.raw_user_meta_data->>'activite_exercee', p.activite_exercee),
  adresse = COALESCE(NULLIF(p.adresse, ''), u.raw_user_meta_data->>'adresse', p.adresse),
  siret = COALESCE(NULLIF(p.siret, ''), u.raw_user_meta_data->>'siret', p.siret)
FROM auth.users u
WHERE p.id = u.id
  AND (
    (p.nom IS NULL OR p.nom = '')
    OR (p.prenom IS NULL OR p.prenom = '')
    OR (p.adresse IS NULL OR p.adresse = '')
    OR (p.siret IS NULL OR p.siret = '')
  );
