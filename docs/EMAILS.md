# 📧 Système d'Emails - Theranice

## Configuration

### 1. Créer un compte Resend
1. Aller sur [resend.com](https://resend.com)
2. Créer un compte gratuit
3. Obtenir votre API key dans le dashboard

### 2. Configuration locale
```bash
# Ajouter dans .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Configuration des destinataires admin
- Les emails admin sont configurés via `ADMIN_EMAILS` et `NEXT_PUBLIC_ADMIN_EMAILS`.
- Guide complet: `docs/ADMIN-EMAILS.md`.

### 3. Configuration production (Vercel)
1. Dans Resend Dashboard → Domains → Add Domain
2. Vérifier votre domaine (theranice.com)
3. Configurer les DNS records (SPF, DKIM, DMARC)
4. Dans Vercel → Settings → Environment Variables :
   - `RESEND_API_KEY` = votre clé API
   - `NEXT_PUBLIC_SITE_URL` = https://theranice.com

### 4. Modifier l'expéditeur
Dans les fichiers API (`src/app/api/send-*`), changer :
```typescript
from: 'Theranice <noreply@theranice.com>'
// ou
from: 'Theranice <contact@theranice.com>'
```

## Emails implémentés

### ✅ Email de confirmation (après réservation)
- **Route API** : `/api/send-confirmation`
- **Trigger** : Après création d'une réservation
- **Contenu** :
  - Récapitulatif de la réservation
  - Date, créneau, salle, prix
  - Code d'accès (6 caractères)
  - Lien vers "Mes réservations"

### 🔴 Email d'annulation
- **Route API** : `/api/send-cancellation`
- **Trigger** : Après annulation d'une réservation
- **Contenu** :
  - Confirmation de l'annulation
  - Détails de la réservation annulée
  - Lien pour faire une nouvelle réservation

## Code d'accès

Actuellement, le code est généré à partir des 6 premiers caractères de l'ID de la réservation (UUID).

### Exemple
```
Booking ID: 550e8400-e29b-41d4-a716-446655440000
Code d'accès: 550E84
```

### Amélioration future
Générer un code plus lisible (ex: ABC123, DEF456) et l'enregistrer en base de données.

## Test en local

1. Installer Resend :
```bash
npm install resend
```

2. Ajouter votre API key dans `.env.local`

3. Faire une réservation test

4. Vérifier dans le dashboard Resend que l'email est envoyé

## Fonctionnalités à ajouter

### 🔔 Email de rappel (24h avant)
- Nécessite un cron job ou service externe (Vercel Cron, Supabase Edge Functions)
- Envoyer un rappel 24h avant le créneau
- Inclure le code d'accès à nouveau

### 💰 Email après paiement
- Une fois Stripe intégré
- Envoyer confirmation uniquement après paiement réussi
- Inclure facture en PDF

### 📊 Email récapitulatif mensuel
- Pour les utilisateurs réguliers
- Statistiques d'utilisation
- Offres fidélité

## Limites du plan gratuit Resend

- **100 emails/jour** (gratuit)
- **3,000 emails/mois** (gratuit)
- Pour plus : Plan Pro à 20$/mois (50,000 emails)

## Dépannage

### L'email n'arrive pas
1. Vérifier que `RESEND_API_KEY` est défini
2. Regarder les logs dans le dashboard Resend
3. Vérifier les spams
4. En production : vérifier que le domaine est bien vérifié

### Renvoyer manuellement une facture
Un endpoint admin permet de renvoyer une facture existante :

- Route : `POST /api/admin/resend-invoice`
- Auth : utilisateur admin connecté (email présent dans `ADMIN_EMAILS`)
- Payload minimal :

```json
{
  "bookingId": "uuid-booking"
}
```

Ou par numéro de facture :

```json
{
  "invoiceNumber": "2026-001"
}
```

Optionnel : forcer une adresse de destination (support client) :

```json
{
  "bookingId": "uuid-booking",
  "email": "cliente@example.com"
}
```

### Générer les factures manuellement (admin)
En cas d'incident ou de retard cron, vous pouvez lancer la génération immédiatement :

- Route : `POST /api/admin/generate-invoices`
- Auth : utilisateur admin connecté (email présent dans `ADMIN_EMAILS`)
- Réponse: reprend le résultat du cron (`generated`, `emailed`, `failed`, `results`)

### Erreur "Invalid from address"
Le domaine d'envoi doit être vérifié dans Resend. En développement, utilisez `onboarding@resend.dev`.

### Code d'accès non affiché
Vérifier que `bookingData.id` est bien retourné dans la requête Supabase (ajouter `.select().single()`).

## Structure des fichiers

```
src/app/api/
├── send-confirmation/
│   └── route.ts          # Email de confirmation
├── admin/
│   ├── generate-invoices/
│   │   └── route.ts      # Déclenchement manuel du cron de factures
│   └── resend-invoice/
│       └── route.ts      # Renvoi manuel d'une facture
└── send-cancellation/
    └── route.ts          # Email d'annulation
```

## Personnalisation des templates

Les emails utilisent du HTML inline. Pour modifier le design :

1. Éditer le template dans `route.ts`
2. Utiliser des outils comme [Litmus](https://litmus.com/) pour tester
3. Garder un CSS inline (meilleure compatibilité)
4. Tester sur différents clients email (Gmail, Outlook, etc.)

## Couleurs du brand

- **Or** : `#D4A373` (utilisé dans les boutons)
- **Crème** : `#FEFAE0` (fond des info-box)
- **Rouge** : `#dc2626` (annulation)
- **Vert** : `#16a34a` (confirmation)
