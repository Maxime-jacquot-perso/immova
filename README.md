# SaaS de pilotage immobilier

Application metier SaaS B2B pour le pilotage d'operations immobilieres.

## Stack

- Landing marketing : Next.js + TypeScript
- Frontend app : React + Vite + TypeScript
- Backend : NestJS
- Base de donnees : PostgreSQL
- ORM : Prisma
- Architecture : monolithe modulaire multi-tenant

## MVP visible

- authentification
- organisations / memberships / roles simples
- projets
- lots
- depenses
- documents
- KPI projet
- export CSV

## Demarrage

```bash
pnpm install
docker compose up -d postgres
cp apps/api/.env.example apps/api/.env
(cd apps/api && pnpm prisma migrate dev --name init)
(cd apps/api && pnpm prisma db seed)
pnpm dev:landing
pnpm dev:web
pnpm dev:api
```

## Comptes de demo

Apres `pnpm prisma db seed`, vous pouvez tester avec :

- `admin@example.com` / `admin123` : compte admin interne `SUPER_ADMIN`, acces a l'application produit et au back-office `/admin`
- `user@example.com` / `user123` : utilisateur standard, acces a l'application produit uniquement

## Tests e2e API

Les tests e2e couvrent les flows critiques du MVP API :

- login
- creation / edition / archivage projet
- creation / edition / archivage lot
- creation / edition / export depense
- upload document lie a une depense

Commande de reference :

```bash
pnpm test:e2e:api
```

Par defaut, les tests utilisent une base locale dediee `immo_ops_e2e`.
Si besoin, vous pouvez la surcharger avec `DATABASE_URL_E2E`.
Le setup refuse volontairement de reset une base dont le nom ne contient pas `e2e`.

## Tests UI Playwright

Les smoke tests UI couvrent le visible strict du lancement :

- login demo
- acces a la liste projets
- creation d'un projet depuis le flow principal
- creation d'un lot dans un projet
- edition / archivage projet
- edition / archivage lot
- creation d'une depense avec justificatif
- edition d'une depense
- verification de l'overview projet et des KPI visibles
- export CSV depuis l'onglet export
- verification du document lie a la depense
- upload direct d'un document depuis l'onglet documents
- consultation settings et ajout d'un membre

Commande de reference :

```bash
pnpm test:e2e:web
```

Le setup seed l'utilisateur demo avant execution, demarre l'API NestJS et le front Vite, puis lance les tests dans Chromium.

## Validation actuelle

- `pnpm build:landing` OK
- `pnpm build:web` OK
- `pnpm build:api` OK
- `pnpm lint:landing` OK
- `pnpm lint:web` OK
- `pnpm lint:api` OK
- `pnpm test:e2e:api` OK
- `pnpm test:e2e:web` OK

## Documentation

- [Cadrage produit](/Users/maximejacquot/dev/Perso/SaaS%20de%20pilotage%20immobilier%20/docs/cadrage-produit-architecture.md)
- [Landing et go-to-market](/Users/maximejacquot/dev/Perso/SaaS%20de%20pilotage%20immobilier%20/docs/landing-page.md)
- [MVP lancement strict](/Users/maximejacquot/dev/Perso/SaaS%20de%20pilotage%20immobilier%20/docs/mvp-lancement-strict.md)
- [Regles projet IA](/Users/maximejacquot/dev/Perso/SaaS%20de%20pilotage%20immobilier%20/AGENTS.md)
