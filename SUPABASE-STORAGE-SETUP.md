# Configuration Supabase Storage pour les documents utilisateurs

## Étape 1 : Créer le bucket

1. Va dans ton projet Supabase : https://supabase.com/dashboard
2. Dans le menu de gauche, clique sur **Storage**
3. Clique sur **New bucket**
4. Nom du bucket : `user-documents`
5. **Public bucket** : **NON** (décocher) - Les documents doivent rester privés
6. Clique sur **Create bucket**

---

## Étape 2 : Configurer les politiques RLS (Row Level Security)

Une fois le bucket créé :

1. Clique sur le bucket `user-documents`
2. Va dans l'onglet **Policies**
3. Clique sur **New policy**

### Politique 1 : Upload des documents (INSERT)
- **Policy name** : `Users can upload their own documents`
- **Allowed operation** : INSERT
- **Target roles** : authenticated
- **Policy definition** : 
```sql
(bucket_id = 'user-documents'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
```

### Politique 2 : Lecture des documents (SELECT)
- **Policy name** : `Users can view their own documents`
- **Allowed operation** : SELECT
- **Target roles** : authenticated
- **Policy definition** :
```sql
(bucket_id = 'user-documents'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
```

### Politique 3 : Mise à jour/Suppression (UPDATE/DELETE)
- **Policy name** : `Users can update their own documents`
- **Allowed operation** : UPDATE
- **Target roles** : authenticated
- **Policy definition** :
```sql
(bucket_id = 'user-documents'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
```

- **Policy name** : `Users can delete their own documents`
- **Allowed operation** : DELETE
- **Target roles** : authenticated
- **Policy definition** :
```sql
(bucket_id = 'user-documents'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
```

---

## Étape 3 : Configuration des limites de fichiers

Dans les **Settings** du bucket (icône engrenage) :
- **File size limit** : 5 MB (5 000 000 bytes)
- **Allowed MIME types** : 
  - `application/pdf`
  - `image/jpeg`
  - `image/png`
  - `image/jpg`

---

## ✅ Vérification

Une fois terminé, tu devrais avoir :
- ✅ Un bucket `user-documents` (privé)
- ✅ 4 politiques RLS (INSERT, SELECT, UPDATE, DELETE)
- ✅ Limite de 5MB par fichier
- ✅ Types de fichiers autorisés : PDF, JPG, PNG

---

## 📝 Structure des fichiers

Les fichiers seront stockés comme suit :
```
user-documents/
  └── {user_id}/
      ├── carte-identite.pdf
      └── kbis.pdf
```

Exemple :
```
user-documents/
  └── 123e4567-e89b-12d3-a456-426614174000/
      ├── carte-identite.pdf
      └── kbis.pdf
```
