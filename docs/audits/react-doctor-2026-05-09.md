# Audit React Doctor - 2026-05-09

## Contexte

- Outil: react-doctor v0.1.4
- Projet scanne: theranice-app
- Framework detecte: Next.js
- Version React detectee: 19.1.0
- Langage detecte: TypeScript
- React Compiler: non detecte
- Fichiers source scannes: 79

## Resultat global

- Score: 75 / 100 (`Great`)
- Diagnostics: 635 warnings, 0 error
- Fichiers affectes: 41 / 79

## Lecture rapide

- Le score reste bon, mais il est fortement charge par des regles de design: 503 diagnostics sont ranges en `Architecture`, dont 407 proviennent uniquement de `design-no-default-tailwind-palette`.
- Les sujets les plus risquants a traiter en priorite sont plutot dans `Next.js`, `Correctness`, `Accessibility`, `Performance` et `State & Effects`.
- Les plus gros hotspots sont `src/app/admin/page.tsx`, `src/app/profil/page.tsx`, `src/app/compte/page.tsx` et `src/app/reservation/page.tsx`.

## Repartition par categorie

| Categorie | Count |
| --- | ---: |
| Architecture | 503 |
| Performance | 39 |
| Next.js | 25 |
| Accessibility | 22 |
| Correctness | 22 |
| Dead Code | 13 |
| State & Effects | 11 |

## Regles les plus frequentes

| Regle | Count |
| --- | ---: |
| design-no-default-tailwind-palette | 407 |
| design-no-redundant-size-axes | 29 |
| react-compiler-destructure-method | 20 |
| nextjs-image-missing-sizes | 17 |
| rerender-functional-setstate | 15 |
| no-generic-handler-names | 14 |
| rendering-hydration-mismatch-time | 14 |
| label-has-associated-control | 13 |
| design-no-three-period-ellipsis | 12 |
| async-await-in-loop | 11 |
| no-giant-component | 10 |
| exports | 8 |

## Hotspots par fichier

| Fichier | Diagnostics |
| --- | ---: |
| src/app/admin/page.tsx | 154 |
| src/app/profil/page.tsx | 75 |
| src/app/compte/page.tsx | 53 |
| src/app/reservation/page.tsx | 50 |
| src/app/page.tsx | 35 |
| src/app/modifier-mot-de-passe/page.tsx | 27 |
| src/app/mes-reservations/page.tsx | 23 |
| src/app/reset-password/page.tsx | 20 |
| src/components/ContactForm.tsx | 20 |
| src/components/LoginModal.tsx | 18 |
| src/app/reservation/success/SuccessPageClient.tsx | 17 |
| src/app/connexion/page.tsx | 17 |
| src/app/reservation/cancel/CancelPageClient.tsx | 11 |
| src/app/mot-de-passe-oublie/page.tsx | 10 |
| src/components/SiteHeader.tsx | 10 |

## Detail par categorie

### Architecture

- `design-no-default-tailwind-palette` x407
- `design-no-redundant-size-axes` x29
- `react-compiler-destructure-method` x20
- `no-generic-handler-names` x14
- `design-no-three-period-ellipsis` x12
- `no-giant-component` x10

Exemples releves:

- `src/components/ContactForm.tsx:58`: usage massif de classes `slate-*` considere comme palette Tailwind par defaut.
- `src/components/Carousel.tsx:52`: `w-6 h-6` signale comme redondant, `size-6` prefere.
- `src/app/compte/page.tsx:93`: suggestion de destructurer `push`/`replace` plutot que d'appeler directement la methode retournee par `useRouter()`.

### Performance

- `rerender-functional-setstate` x15
- `async-await-in-loop` x11
- `js-flatmap-filter` x6

Exemples releves:

- `src/app/admin/page.tsx:1578`: mise a jour d'etat de type `setState({ ...state, ... })` a convertir en forme fonctionnelle.
- `src/app/api/webhooks/stripe/route.ts:166`: `await` sequentiel dans une boucle, candidat a un `Promise.all` si les operations sont independantes.
- `src/app/api/create-checkout-session/route.ts:62`: `.map().filter(Boolean)` signale comme double parcours evitables.

### Next.js

- `nextjs-image-missing-sizes` x17
- `nextjs-no-a-element` x4
- `nextjs-no-client-side-redirect` x4

Exemples releves:

- `src/app/conditions-generales/page.tsx:21`: `next/image` avec `fill` sans prop `sizes`.
- `src/app/compte/page.tsx:298`: lien interne en `<a>` au lieu de `next/link`.
- `src/app/mes-reservations/page.tsx:52`: redirection client dans `useEffect` via router.

### Accessibility

- `label-has-associated-control` x13
- `design-no-vague-button-label` x3
- `no-static-element-interactions` x3
- `click-events-have-key-events` x3

Exemples releves:

- `src/app/admin/page.tsx:1573`: labels sans association explicite avec leur controle.
- `src/components/LoginModal.tsx:105`: element cliquable non semantique sans gestion clavier/role approprie.

### Correctness

- `rendering-hydration-mismatch-time` x14
- `no-danger` x5
- `no-array-index-as-key` x2
- `no-uncontrolled-input` x1

Exemples releves:

- `src/app/conditions-generales/page.tsx:252`: `new Date()` rendu depuis JSX, risque de divergence SSR/client.
- `src/app/faq/page.tsx:97`: usage de `dangerouslySetInnerHTML`.
- `src/components/Carousel.tsx:87`: `index` utilise comme cle de liste.

### State & Effects

- `prefer-useReducer` x7
- `no-cascading-set-state` x4

Exemples releves:

- `src/app/reset-password/page.tsx:11`: 7 `useState` dans le meme composant, `useReducer` suggere.
- `src/app/reset-password/page.tsx:21`: 9 `setState` dans un seul `useEffect`.
- `src/contexts/AuthContext.tsx:67`: 9 `setState` dans un seul `useEffect`.

### Dead Code

- `exports` x8
- `files` x3
- `types` x2

## Priorites conseillees

1. Corriger les `next/image` sans `sizes` et les redirections client dans `useEffect`.
2. Supprimer les risques de mismatch SSR/client lies a `new Date()` dans le rendu.
3. Corriger les points d'accessibilite sur les labels et les elements cliquables non semantiques.
4. Stabiliser les mises a jour d'etat les plus sensibles (`setState(prev => ...)`, `useReducer`, reduction des `setState` en cascade).
5. Revoir les usages de `dangerouslySetInnerHTML` et les `index` en `key`.
6. Traiter ensuite le lot de design Tailwind pour faire remonter rapidement le score sans melanger ces sujets avec les risques fonctionnels.

## Commandes utilisees

Commande texte:

```powershell
npx -y -p node@22 -p pnpm pnpm dlx react-doctor@latest . --offline --project theranice-app
```

Commande JSON:

```powershell
npx -y -p node@22 -p pnpm pnpm --silent dlx react-doctor@latest . --json --offline --project theranice-app
```

## Notes d'environnement

- Le `npx -y react-doctor@latest .` direct echoue sur cette machine car `react-doctor@0.1.4` requiert Node >= 22, alors que l'environnement courant est en Node 20.10.0.
- L'execution via `pnpm dlx` sous un runtime Node 22 temporaire contourne aussi un probleme de dependance native optionnelle (`oxc-parser`) observe avec `npx` seul sous Windows.