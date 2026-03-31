# SaaS de pilotage immobilier

Monorepo SaaS B2B pour piloter des operations immobilieres simples et fiables.
Le produit cible les investisseurs immobiliers, marchands de biens et petites structures multi-projets.

## Positionnement

Le coeur du produit reste volontairement limite a :

- projets
- lots
- depenses / factures
- documents
- KPI projet simples et fiables
- export CSV comptable simple

Le produit n'est ni un logiciel de gestion locative classique, ni un ERP immobilier.

## Stack et architecture

- `apps/landing` : Next.js + TypeScript
- `apps/web` : React + Vite + TypeScript
- `apps/api` : NestJS + Prisma
- Base de donnees : PostgreSQL
- Architecture : monolithe modulaire multi-tenant

## Structure du repo

```text
.
|-- apps/
|   |-- api/
|   |-- landing/
|   `-- web/
|-- .github/
|   `-- workflows/
|-- docs/
|-- AGENTS.md
|-- docker-compose.yml
|-- package.json
`-- pnpm-workspace.yaml
```

## Prerequis

- Node.js 20+
- pnpm 9+
- PostgreSQL local ou Docker

## Demarrage local

1. Installer les dependances :

```bash
pnpm install
```

2. Preparer l'environnement backend :

```bash
cp apps/api/.env.example apps/api/.env
```

3. Demarrer PostgreSQL si besoin :

```bash
docker compose up -d postgres
```

4. Initialiser la base :

```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma db seed
```

5. Lancer les applications dans des terminaux separes depuis la racine :

```bash
pnpm dev:landing
pnpm dev:web
pnpm dev:api
```

## Comptes de demo

Apres le seed Prisma :

- `admin@example.com` / `admin123` : compte `SUPER_ADMIN`, acces a l'application produit et au back-office `/admin`
- `user@example.com` / `user123` : utilisateur standard, acces a l'application produit

## Scripts utiles

Depuis la racine du monorepo :

```bash
pnpm lint
pnpm build
pnpm build:landing
pnpm build:web
pnpm build:api
pnpm lint:landing
pnpm lint:web
pnpm lint:api
pnpm test:e2e:api
pnpm test:e2e:web
```

Pour corriger automatiquement le lint backend si besoin :

```bash
cd apps/api
pnpm lint:fix
```

## CI GitHub Actions

Le repo embarque une CI GitHub Actions volontairement simple, sous `.github/workflows/`.

- `ci.yml` : workflow principal se lance sur `push` et `pull_request` vers `main`, avec installation des dependances, `pnpm lint` puis `pnpm build`
- `e2e-api.yml` : workflow separe pour `pnpm test:e2e:api`, lance sur `push` et `pull_request` vers `main` quand la pile backend evolue, plus en `workflow_dispatch`, avec PostgreSQL 16 en service GitHub Actions, generation du client Prisma et execution des tests backend
- `test:e2e:web` reste volontairement hors CI principale pour garder un feedback rapide et stable sur le socle `lint + build`

Les deux workflows utilisent Node.js 20 et `pnpm@9.4.0`, alignes sur l'etat actuel du repo.

## GitHub et hygiene du repo

Les fichiers et repertoires suivants sont locaux et ne doivent pas etre publies :

- `.env` et variantes locales
- `node_modules`
- artefacts de build `dist`, `build`, `.next`, `coverage`
- uploads runtime de l'API
- temporaires de tests
- volumes Docker et bases locales

Le repo fournit `apps/api/.env.example` comme point d'entree pour la configuration locale.

## Tests et validation

Verification locale recommandee avant push :

```bash
pnpm lint
pnpm build
pnpm test:e2e:api
```

Notes utiles :

- les tests e2e API utilisent par defaut la base `immo_ops_e2e`
- le setup e2e refuse de reset une base dont le nom ne contient pas `e2e`
- les smoke tests Playwright couvrent login, projets, lots, depenses, documents, export et settings
- `pnpm test:e2e:web` reste utile en local ou dans un workflow dedie plus tard, mais n'alourdit pas la CI de base pour l'instant

## Documentation

- [Cadrage produit](docs/cadrage-produit-architecture.md)
- [Landing et go-to-market](docs/landing-page.md)
- [MVP lancement strict](docs/mvp-lancement-strict.md)
- [Regles projet IA](AGENTS.md)
