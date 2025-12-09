-- ====================================
-- Vérifier et corriger les policies Storage pour user-documents
-- ====================================

-- 1. Vérifier les policies existantes
SELECT 
  name as policy_name,
  definition
FROM storage.policies
WHERE bucket_id = 'user-documents';

-- 2. Supprimer les anciennes policies si elles existent
DELETE FROM storage.policies WHERE bucket_id = 'user-documents';

-- 3. Créer les nouvelles policies

-- Policy INSERT : Les utilisateurs peuvent uploader leurs propres documents
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Users can upload their own documents',
  'user-documents',
  '(bucket_id = ''user-documents''::text) AND (auth.uid()::text = (storage.foldername(name))[1])'
);

-- Policy SELECT : Les utilisateurs peuvent voir leurs propres documents
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Users can view their own documents',
  'user-documents',
  '(bucket_id = ''user-documents''::text) AND (auth.uid()::text = (storage.foldername(name))[1])'
);

-- Policy UPDATE : Les utilisateurs peuvent mettre à jour leurs propres documents
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Users can update their own documents',
  'user-documents',
  '(bucket_id = ''user-documents''::text) AND (auth.uid()::text = (storage.foldername(name))[1])'
);

-- Policy DELETE : Les utilisateurs peuvent supprimer leurs propres documents
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Users can delete their own documents',
  'user-documents',
  '(bucket_id = ''user-documents''::text) AND (auth.uid()::text = (storage.foldername(name))[1])'
);

-- 4. Vérifier que les policies ont bien été créées
SELECT 
  name as policy_name,
  definition
FROM storage.policies
WHERE bucket_id = 'user-documents';
