# Configuration Nuki Smart Lock Pro + Keypad 2.0

## Prérequis

- Nuki Smart Lock Pro installé sur la porte du local
- Nuki Keypad 2.0 associé au Smart Lock via l'app Nuki
- Un Nuki Bridge connecté au WiFi (nécessaire pour l'API Web)
- Compte Nuki Web (https://web.nuki.io)

---

## Étape 1 : Obtenir le token API Nuki

1. Connectez-vous sur **https://web.nuki.io**
2. Allez dans **Mon compte** → **API**
3. Cliquez sur **Générer un token API**
4. Donnez un nom : `Theranice App`
5. Cochez les scopes nécessaires :
   - `smartlock` (lecture)
   - `smartlock.auth` (lecture + écriture)
6. Copiez le token généré

> ⚠️ Le token n'est affiché qu'une seule fois. Sauvegardez-le immédiatement.

---

## Étape 2 : Trouver l'ID du Smart Lock

Exécutez cette commande (remplacez `VOTRE_TOKEN`) :

```bash
curl -H "Authorization: Bearer VOTRE_TOKEN" https://api.nuki.io/smartlock
```

La réponse contient un tableau JSON. Notez le `smartlockId` de votre serrure :

```json
[
  {
    "smartlockId": 123456789,
    "name": "Porte Theranice",
    ...
  }
]
```

---

## Étape 3 : Variables d'environnement

Ajoutez ces variables dans **Vercel** (Settings → Environment Variables) :

| Variable | Description | Exemple |
|---|---|---|
| `NUKI_API_TOKEN` | Token API Nuki Web | `abc123...` |
| `NUKI_SMARTLOCK_ID` | ID du Smart Lock | `123456789` |
| `CRON_SECRET` | Secret pour protéger le cron job de nettoyage | Générez un UUID aléatoire |

Pour le développement local, ajoutez-les dans `.env.local` :

```env
NUKI_API_TOKEN=votre_token_ici
NUKI_SMARTLOCK_ID=votre_smartlock_id_ici
CRON_SECRET=un_secret_aleatoire
```

---

## Étape 4 : Migration de la base de données

Exécutez le script SQL dans l'éditeur SQL de Supabase :

1. Allez sur votre projet Supabase → **SQL Editor**
2. Copiez le contenu de `supabase-nuki-migration.sql`
3. Exécutez le script

Ce script ajoute les colonnes suivantes à la table `bookings` :
- `access_code` : Le code PIN à 6 chiffres
- `nuki_auth_id` : L'ID de l'autorisation côté Nuki (pour pouvoir la révoquer)
- `nuki_code_status` : Le statut du code (`none`, `active`, `error`, `revoked`, `revoke_failed`)

---

## Étape 5 : Déployer sur Vercel

```bash
git add .
git commit -m "feat: Nuki Smart Lock integration"
git push
```

Le fichier `vercel.json` configure automatiquement un cron job quotidien à 2h du matin pour révoquer les codes expirés.

---

## Fonctionnement

### Flux de création de code

1. Le client paie via Stripe
2. Le webhook Stripe confirme le paiement
3. Un code PIN unique à 6 chiffres est généré
4. Le code est programmé sur le Keypad Nuki via l'API Web avec :
   - Restrictions de date (jour de la réservation uniquement)
   - Restrictions horaires (créneau réservé + 30 min de marge)
5. Le code est sauvegardé en base et envoyé par email au client

### Flux d'annulation

1. Le client annule sa réservation (ou l'admin la supprime)
2. L'API `/api/cancel-booking` est appelée
3. Le code Nuki est révoqué via l'API (suppression de l'autorisation)
4. Le statut du code passe à `revoked`

### Nettoyage automatique (Cron)

- Chaque jour à 2h du matin, `/api/cron/cleanup-nuki-codes` s'exécute
- Tous les codes dont la date de réservation est passée sont révoqués
- Ceci est une sécurité supplémentaire (les codes sont déjà limités dans le temps)

### Créneaux horaires

| Créneau | Heures d'accès au code |
|---|---|
| Matin | 7h30 - 12h30 |
| Après-midi | 12h30 - 17h30 |
| Journée complète | 7h30 - 17h30 |

> 30 minutes de marge sont ajoutées avant et après le créneau pour l'installation et le rangement.

---

## Statuts des codes Nuki

| Statut | Signification |
|---|---|
| `none` | Pas de code (réservation admin manuelle, etc.) |
| `active` | Code actif, programmé sur le keypad |
| `error` | Erreur lors de la création du code (l'admin doit intervenir) |
| `revoked` | Code révoqué (annulation ou expiration) |
| `revoke_failed` | Échec de la révocation (l'admin doit vérifier manuellement sur web.nuki.io) |

---

## Dépannage

### Le code ne fonctionne pas sur le keypad

1. Vérifiez que le Nuki Bridge est en ligne (LED verte)
2. Synchronisez le keypad via l'app Nuki
3. Vérifiez sur https://web.nuki.io que l'autorisation existe bien

### Erreur lors de la création du code

- Vérifiez que `NUKI_API_TOKEN` est valide et non expiré
- Vérifiez que `NUKI_SMARTLOCK_ID` est correct
- Consultez les logs Vercel pour plus de détails

### Le cron ne s'exécute pas

- Vérifiez que `CRON_SECRET` est configuré dans les variables d'environnement Vercel
- Les crons Vercel nécessitent un plan Pro ou supérieur
- Alternative : configurez un service externe (cron-job.org) pour appeler `POST /api/cron/cleanup-nuki-codes` avec le header `Authorization: Bearer VOTRE_CRON_SECRET`
