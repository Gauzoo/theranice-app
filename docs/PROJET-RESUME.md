# Résumé du Projet Theranice

## 🎯 Objectif
Application Next.js de réservation de salles de thérapie avec paiement Stripe et dashboard admin.

## 🏗️ Architecture Technique
- **Framework**: Next.js 14 (App Router)
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth
- **Paiement**: Stripe
- **Styling**: Tailwind CSS
- **Déploiement**: Vercel
- **Emails**: Resend

## 📦 Fonctionnalités Principales

### 1. **Page d'accueil** (`src/app/page.tsx`)
- Hero section avec image
- Présentation des salles
- Section tarifs
- CTA vers réservation

### 2. **Système d'authentification**
- Inscription (`src/app/inscription/page.tsx`)
- Connexion (`src/app/connexion/page.tsx`)
- Création automatique de profil dans table `profiles`

### 3. **Réservation** (`src/app/reservation/page.tsx`)
- **3 salles**: Salle 1 (50€), Salle 2 (50€), Grande salle (80€)
- **3 créneaux**:
  - Matin (8h-12h) - 50€ ou 80€
  - Après-midi (13h-17h) - 50€ ou 80€
  - **Journée complète (8h-17h)** - 90€ (petites salles) ou 140€ (grande salle)
- **Logique de disponibilité complexe**:
  - Journée bloque matin + après-midi
  - Grande salle en journée bloque TOUTES les autres salles
  - Vérification en temps réel depuis Supabase
- Calendrier avec react-calendar
- Paiement via Stripe Checkout

### 4. **Webhook Stripe** (`src/app/api/webhooks/stripe/route.ts`)
- **CRITIQUE**: Vérification serveur de la disponibilité AVANT création
- Utilise `SUPABASE_SERVICE_ROLE_KEY` pour bypasser RLS
- Crée la réservation uniquement si slot disponible
- Envoie email de confirmation via API

### 5. **Page Mes Réservations** (`src/app/mes-reservations/page.tsx`)
- Liste des réservations du client
- Possibilité d'annuler (status = 'cancelled')
- Envoie email d'annulation

### 6. **Dashboard Admin** (`src/app/admin/page.tsx`)
- **Accès restreint**: Emails admins via variables d'environnement `ADMIN_EMAILS` / `NEXT_PUBLIC_ADMIN_EMAILS`
- **Statistiques**:
  - Revenus totaux
  - Revenus du mois
  - Nombre total de réservations
  - Réservations à venir
- **Section Réservations**:
  - Filtres: Aujourd'hui / À venir / Passées / Toutes
  - Liste avec toutes les infos (date, créneau, salle, client, contact, prix, statut)
  - **Bouton Supprimer** (avec confirmation)
  - **Bouton "+ Ajouter une réservation"**:
    - Modal avec formulaire complet
    - Sélection du client (dropdown des membres)
    - Date, créneau, salle
    - Calcul automatique du prix
    - Vérification de disponibilité avant insertion
    - Création sans payment_intent_id (réservation manuelle)
- **Section Membres**:
  - Liste de tous les membres inscrits
  - Affichage: Prénom, Nom, Téléphone, Date d'inscription
  - **Bouton Modifier**: Modal pour éditer nom, prénom, téléphone
  - **Bouton Supprimer**: Avec vérification (impossible si réservations existantes)

### 7. **APIs**
- `/api/create-checkout-session`: Crée session Stripe
- `/api/webhooks/stripe`: Traite les paiements et crée réservations
- `/api/send-confirmation`: Email de confirmation
- `/api/send-cancellation`: Email d'annulation

## 🗄️ Base de Données Supabase

### Table `profiles`
```sql
- id (uuid, FK vers auth.users)
- nom (text)
- prenom (text)
- telephone (text)
- created_at (timestamp)
```

### Table `bookings`
```sql
- id (uuid)
- user_id (uuid, FK vers profiles)
- date (date)
- slot (text) CHECK IN ('morning', 'afternoon', 'fullday')
- room (text) CHECK IN ('room1', 'room2', 'large')
- price (numeric)
- status (text) DEFAULT 'confirmed'
- payment_intent_id (text, nullable pour réservations manuelles)
- created_at (timestamp)
```

### RLS Policies
- `profiles`: INSERT/SELECT pour authenticated
- `bookings`: 
  - SELECT pour authenticated
  - INSERT pour authenticated (permet webhook + admin)
  - UPDATE pour authenticated
  - DELETE pour authenticated (permet admin de supprimer)

## 🔑 Variables d'Environnement (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://vbgwtqdjbayuxytmbxlz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_edc2b2d93ae157c9e6440eb9d0b094f783621f132b92317e61a3e49a29c4e626

RESEND_API_KEY=re_...
```

## 🛠️ Configuration Locale (Développement)

### Stripe CLI
- **Installé localement**: `stripe.exe` en PATH
- **Commande webhook**: 
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```
- **Webhook secret**: Expire dans 90 jours, à renouveler
- Permet de tester les paiements en local

## 🎨 Design
- Palette de couleurs:
  - Primaire: `#D4A373` (marron doré)
  - Secondaire: `#FAEDCD` (beige clair)
  - Fond: `#FEFAE0` (crème)
- Police: EB Garamond (serif élégante)
- Style: Épuré, professionnel, zen

## 🐛 Bugs Résolus

1. **Double réservation**: 
   - Problème: Utilisateur pouvait réserver 2x le même slot sans rafraîchir
   - Solution: Vérification serveur dans webhook + changement de `window.open` en `window.location.href`

2. **Grande salle journée ne bloquait pas les autres**:
   - Solution: Ajout de `largeFulldayBooked` check dans `isSlotAvailable()`

3. **RLS bloquait webhook**:
   - Solution: Utilisation de `service_role_key` dans webhook

4. **Erreur compilation Vercel**:
   - `useSearchParams()` sans Suspense → Ajout de Suspense boundary
   - TypeScript `any` → Typage explicite partout

5. **Liste utilisateurs vide dans modal admin**:
   - Problème: Tentative de récupérer `profiles.email` (n'existe pas)
   - Solution: Requête sans email, affichage du téléphone à la place

## 📋 TODO / À Faire

### Avant Production
- [ ] Ajouter colonne `email` dans table `profiles` (script SQL créé: `supabase-add-email-to-profiles.sql`)
- [ ] Remplacer l'email admin hardcodé par un système de rôles
- [ ] Appliquer `docs/BOOKINGS-UNIQUE-CONSTRAINT.sql` (anti-doublon manuel admin)
- [ ] Configurer webhook Stripe en production (URL Vercel)
- [ ] Remplacer clés Stripe test par clés live du client
- [ ] Tester flux complet en production

### Améliorations Futures (Optionnel)
- [ ] Remboursement automatique en cas de double paiement
- [ ] Calendrier visuel dans admin
- [ ] Export CSV des réservations
- [ ] Notifications email personnalisées (templates)
- [ ] Système de fidélité
- [ ] Gestion des disponibilités (bloquer dates pour maintenance)

## 📝 Notes Importantes

1. **Admin email**: Configuré via `ADMIN_EMAILS` (serveur) et `NEXT_PUBLIC_ADMIN_EMAILS` (client), voir `docs/ADMIN-EMAILS.md`
2. **Webhook local**: Nécessite Stripe CLI en cours d'exécution (`stripe listen`)
3. **Service role key**: Utilisé UNIQUEMENT dans webhook serveur, JAMAIS côté client
4. **Slot fullday**: Prix différents selon la salle (90€ vs 140€)
5. **Réservations manuelles**: N'ont pas de `payment_intent_id` dans la DB

## 🚀 Commandes Utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Stripe webhook local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Déploiement Vercel
git push origin main  # Auto-deploy configuré
```

## 📞 Contact Client
Email admin: défini dans `ADMIN_EMAILS`
