# Ajouter un email admin (local + production)

## Objectif
Ajouter un nouvel administrateur pour:
- l'acces aux pages et APIs admin
- la visibilite du lien admin dans le header
- la reception des emails de notification admin

## Variables a mettre a jour
Les deux variables doivent toujours rester synchronisees:

- `ADMIN_EMAILS` (serveur)
- `NEXT_PUBLIC_ADMIN_EMAILS` (client)

Format attendu: liste d'emails separes par des virgules.

Exemple:

```env
ADMIN_EMAILS=gauthier.guerin@gmail.com,nouvel.admin@gmail.com
NEXT_PUBLIC_ADMIN_EMAILS=gauthier.guerin@gmail.com,nouvel.admin@gmail.com
```

## Procedure locale
1. Ouvrir votre fichier `.env.local`.
2. Ajouter le nouvel email dans `ADMIN_EMAILS`.
3. Ajouter le meme email dans `NEXT_PUBLIC_ADMIN_EMAILS`.
4. Redemarrer `npm run dev`.

## Procedure production (Vercel)
1. Vercel > Project > Settings > Environment Variables.
2. Mettre a jour `ADMIN_EMAILS` pour l'environnement `Production`.
3. Mettre a jour `NEXT_PUBLIC_ADMIN_EMAILS` avec la meme liste.
4. Refaire les memes changements pour `Preview` si utilise.
5. Relancer un deploiement.

## Verification rapide
1. Se connecter avec le nouvel email admin.
2. Verifier que le lien admin est visible dans le header.
3. Ouvrir `/admin` et verifier l'acces.
4. Appeler `/api/admin/debug-access` et verifier:
   - `isAdmin: true`
   - `adminEmailsConfigured` contient le nouvel email
5. Declencher une notification admin (upload docs profil) et verifier la reception email.

## Fichiers relies
- `src/middleware.ts` (protection des routes admin)
- `src/lib/adminAuth.ts` (garde serveur pour APIs admin)
- `src/components/SiteHeader.tsx` (affichage du lien admin)
- `src/app/api/emails/notify-admin/route.ts` (destinataires des emails admin)
- `src/app/api/admin/debug-access/route.ts` (endpoint de verification)
- `src/app/api/cancel-booking/route.ts` (bypass admin sur l'annulation)

## Bonnes pratiques
- Ecrire les emails en minuscules.
- Eviter les espaces inutiles autour des virgules.
- Toujours modifier les 2 variables ensemble.
- Verifier localement avant de pousser en production.
