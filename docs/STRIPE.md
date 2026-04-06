# 💳 Système de Paiement Stripe - Theranice

## Configuration

### 1. Créer un compte Stripe
1. Aller sur [stripe.com](https://stripe.com)
2. Créer un compte (gratuit)
3. Activer le mode Test pour le développement

### 2. Obtenir les clés API
Dans le dashboard Stripe → Developers → API keys :
- **Publishable key** (commence par `pk_test_...`)
- **Secret key** (commence par `sk_test_...`)

### 3. Variables d'environnement

Ajouter dans `.env.local` :
```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Mode live-test (optionnel)
# Active uniquement un tarif de test pour des emails autorisés
STRIPE_LIVE_TEST_ENABLED=false
STRIPE_LIVE_TEST_EMAILS=cliente1@email.com,cliente2@email.com
STRIPE_LIVE_TEST_AMOUNT_CENTS=50
```

## Mode live-test en production

Le checkout supporte un mode de test live sécurisé pour facturer un petit montant réel.

- Le minimum Stripe en EUR est `0.50` (soit `50` centimes).
- Le mode est activé uniquement si `STRIPE_LIVE_TEST_ENABLED=true`.
- Le mode s'applique seulement aux emails listés dans `STRIPE_LIVE_TEST_EMAILS`.
- Le montant est contrôlé par `STRIPE_LIVE_TEST_AMOUNT_CENTS` (minimum forcé à `50`).
- Le panier est limité à un seul créneau en live-test pour garder une comptabilité claire.

### Procédure recommandée

1. Mettre `STRIPE_LIVE_TEST_ENABLED=true`.
2. Ajouter l'email client cible dans `STRIPE_LIVE_TEST_EMAILS`.
3. Laisser `STRIPE_LIVE_TEST_AMOUNT_CENTS=50`.
4. Faire le paiement live.
5. Vérifier webhook + réservation + emails.
6. Désactiver immédiatement: `STRIPE_LIVE_TEST_ENABLED=false`.

### 4. Base de données Supabase

Exécuter le SQL dans Supabase SQL Editor :
```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent 
ON bookings(payment_intent_id);
```

### 5. Configuration du Webhook

#### En développement (Stripe CLI)

1. Installer Stripe CLI :
```bash
# Windows (avec Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# macOS (avec Homebrew)
brew install stripe/stripe-cli/stripe

# Linux
# Télécharger depuis https://github.com/stripe/stripe-cli/releases
```

2. Se connecter :
```bash
stripe login
```

3. Lancer le webhook en local :
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Copier le webhook secret affiché (`whsec_...`) dans `.env.local`

#### En production (Vercel)

1. Dans Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL : `https://votre-domaine.com/api/webhooks/stripe`
3. Événements à écouter : `checkout.session.completed`
4. Copier le webhook secret
5. Dans Vercel → Settings → Environment Variables :
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Architecture

### Flux de paiement

1. **Utilisateur sélectionne date/créneau/salle** → Page `/reservation`
2. **Clic sur "Réserver et payer"** → Appelle `/api/create-checkout-session`
3. **API crée session Stripe** → Retourne URL de checkout
4. **Redirection vers Stripe Checkout** → Utilisateur paie
5. **Paiement réussi** → Stripe envoie webhook à `/api/webhooks/stripe`
6. **Webhook crée la réservation** → Insère dans Supabase
7. **Email de confirmation envoyé** → Via Resend
8. **Redirection vers** → `/reservation/success`

### Fichiers créés

```
src/app/api/
├── create-checkout-session/
│   └── route.ts              # Crée session de paiement Stripe
└── webhooks/
    └── stripe/
        └── route.ts          # Reçoit confirmation de paiement

src/app/reservation/
├── success/
│   └── page.tsx              # Page après paiement réussi
└── cancel/
    └── page.tsx              # Page après annulation paiement

supabase/migrations/
└── add_payment_intent_id.sql # Migration base de données
```

## Test en développement

### 1. Démarrer l'app
```bash
npm run dev
```

### 2. Lancer le webhook Stripe (terminal séparé)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 3. Faire un test de réservation

Utiliser les cartes de test Stripe :
- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0025 0000 3155`

Date d'expiration : N'importe quelle date future  
CVC : N'importe quels 3 chiffres

### 4. Vérifier le webhook

Dans les logs Stripe CLI, vous devriez voir :
```
✔ webhook received (checkout.session.completed)
✔ webhook forwarded to localhost:3000/api/webhooks/stripe
```

### 5. Vérifier la base de données

Dans Supabase, la table `bookings` devrait avoir :
- Une nouvelle ligne avec le `payment_intent_id`
- Status : `confirmed`

## Montants et devises

- **Devise** : EUR (euros)
- **Prix** :
  - Salle 1 : 50€
  - Salle 2 : 50€
  - Grande salle : 80€
- **Commission Stripe** : ~1.4% + 0.25€ par transaction (tarif européen)

## Sécurité

### ✅ Bonnes pratiques implémentées

1. **Vérification de la signature du webhook** : Empêche les fausses requêtes
2. **Métadonnées dans la session** : Permet de recréer la réservation
3. **Clé secrète côté serveur uniquement** : Jamais exposée au client
4. **Statut confirmé uniquement après paiement** : Via webhook
5. **Gestion des erreurs** : Try/catch sur toutes les routes

### ⚠️ Points d'attention

- Ne JAMAIS créer de réservation avant confirmation du webhook
- Vérifier la disponibilité même après paiement (double booking)
- Logger tous les événements webhook pour debugging
- Tester les cas d'échec (carte refusée, timeout, etc.)

## Erreurs courantes

### "Missing API key"
→ Vérifier que `STRIPE_SECRET_KEY` est dans `.env.local` et Vercel

### "Invalid signature"
→ Le `STRIPE_WEBHOOK_SECRET` ne correspond pas au webhook

### "Webhook not received"
→ En dev : vérifier que Stripe CLI est lancé  
→ En prod : vérifier l'URL du webhook dans Stripe Dashboard

### "Booking not created after payment"
→ Regarder les logs du webhook dans Stripe Dashboard  
→ Vérifier que Supabase est accessible depuis Vercel

## Passage en production

### 1. Activer les paiements réels
Dans Stripe Dashboard :
- Compléter les informations de l'entreprise
- Ajouter un compte bancaire
- Activer les paiements réels

### 2. Basculer vers les clés de production
- Remplacer `pk_test_...` par `pk_live_...`
- Remplacer `sk_test_...` par `sk_live_...`
- Créer un nouveau webhook en production

### 3. Tester avec de vrais petits montants
Faire quelques tests à 1€ pour vérifier le flux complet

### 4. Configurer les remboursements
Décider de la politique de remboursement (24h avant, etc.)

## Améliorations futures

### 💡 Idées

1. **Factures PDF** : Générer et envoyer des factures automatiquement
2. **Abonnements** : Pour les utilisateurs réguliers (forfait mensuel)
3. **Coupons de réduction** : Codes promo Stripe
4. **Remboursements automatiques** : En cas d'annulation dans les délais
5. **Paiement en plusieurs fois** : Via Klarna ou autres partenaires Stripe
6. **Dashboard admin** : Voir toutes les transactions Stripe
7. **Exports comptables** : CSV des paiements pour la comptabilité

## Support

- **Documentation Stripe** : [stripe.com/docs](https://stripe.com/docs)
- **API Reference** : [stripe.com/docs/api](https://stripe.com/docs/api)
- **Stripe CLI** : [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
- **Support Stripe** : support@stripe.com
