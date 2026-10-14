# Festival Bénévoles — Festival Films Courts de Dinan

Application Next.js de gestion des bénévoles (missions, inscriptions, responsables de catégories).

## Stack
- Next.js 16 (App Router), React 19, TypeScript, Tailwind + shadcn/ui
- Auth : **Auth.js v5** (`next-auth@beta`), Google + lien magique par email (Resend), sessions JWT
- Base : **Neon PostgreSQL** via **Drizzle ORM** (`@neondatabase/serverless`, driver HTTP)
- Emails : Resend. Données serveur côté client : TanStack Query
- Déploiement : Vercel

## Déploiement
- Projet Vercel : `benevoles4` (team `albertduplantins-projects`), prod : https://benevoles4.vercel.app
- Dépôt GitHub de prod : `albertduplantin/benevoles4` (remote git `benevoles4`, branche `main`). Le remote `origin` pointe vers l'ancien dépôt `benevoles3` : ne pas pousser dessus pour déployer.
- Base Neon : endpoint `ep-bitter-credit-agw7unej`, base `neondb`, région eu-central-1.

## Architecture
- `auth.config.ts` : config Edge (middleware) ; `auth.ts` : config complète (adaptateur Drizzle, callbacks JWT). Le JWT embarque rôle, prénom, nom, téléphone, catégories ; relus en base toutes les 60 s.
- `middleware.ts` : protège pages et API (401 JSON pour `/api/*`). Publics : `/`, `/auth/*`, `/api/auth/*`, `/mes-missions`, `/api/personal`.
- `lib/db/schema.ts` : schéma Drizzle. `drizzle/*.sql` : migrations SQL appliquées à la main sur Neon.
- `lib/server/` : code serveur uniquement (`api.ts` : `requireUser`, `handle`, `HttpError` ; `missions.ts` : inscriptions, liste d'attente, notifications ; `mappers.ts` : ligne DB -> types client ; `email.ts`).
- `app/api/**` : routes REST. Toujours `requireUser([...rôles])` puis `handle(...)`.
- `lib/api/**` : client fetch côté navigateur (mêmes noms de fonctions que l'ancien Firebase) ; `http.ts` convertit les dates ISO en `Date`.
- Rôles : `volunteer` < `category_responsible` < `admin`. Une catégorie a pour `id` sa `value` ; `users.responsibleForCategories` contient ces ids.
- Bénévoles « email-only » : pas de connexion, accès par jeton personnel (`/mes-missions?token=`).

## Règles
- Inscriptions : un seul `UPDATE` conditionnel en SQL (jamais lire puis écrire) pour éviter de dépasser les places.
- Ne jamais renvoyer `personalToken`, FCM tokens ni coordonnées d'un utilisateur à un simple bénévole.
- Dates : toujours en ISO UTC dans l'API ; convertir les `datetime-local` côté navigateur (`toIso`).
- Valider les entrées avec Zod côté serveur. Pas de nouvelle dépendance Firebase ou Clerk : retirées.
- Conventions : camelCase, composants PascalCase, fichiers kebab-case, imports `@/`, Server Components par défaut.

## Variables d'environnement
`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_BASE_URL`, et optionnellement `AUTH_EMAIL_FROM` (expéditeur sur un domaine Resend vérifié : active la connexion par lien magique).
Ne jamais afficher ni committer `.env*`. `*firebase-adminsdk*.json` est ignoré par git.

## Commandes
- `npm run dev` : serveur local (http://localhost:3000)
- `npx tsc --noEmit` : typecheck ; `npm run build` : build de production (`AUTH_SECRET` requis)
- Migration SQL : exécuter le fichier de `drizzle/` dans l'éditeur SQL de Neon

## Tests
- `npm run test:api` : tests d'API et de pages (12 scénarios, ~15 s). Le serveur doit tourner (`npm run dev`) ; `BASE_URL=https://... npm run test:api` pour tester un déploiement.
- `tests/helpers.mjs` signe un cookie de session Auth.js avec `AUTH_SECRET` : pas besoin de Google. Toutes les données créées sont préfixées `test_` et supprimées à la fin.
- Après un changement, lancer les tests et ne lire que les échecs (`| grep -E "✖|fail"`).

## Points d'attention
- Emails : sans domaine vérifié, Resend n'envoie qu'au propriétaire du compte.
- Notifications push (FCM) abandonnées ; notifications in-app (table `notifications`, polling 30 s) + email.
- Comptes existants rattachés par email à la première connexion Google (`allowDangerousEmailAccountLinking`).
