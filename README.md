# SaaS de pilotage immobilier

Monorepo SaaS B2B pour decider et piloter des operations immobilieres simples et fiables.
Le produit cible les investisseurs immobiliers, marchands de biens et petites structures multi-projets.

## Positionnement

Axelys aide a **arbitrer entre plusieurs opportunites immobilieres AVANT achat**, puis a **mesurer l'ecart entre hypothese initiale et realite terrain APRES acquisition**.

Le produit couvre 2 temps :

**Decision avant achat :**
- dossiers d'opportunites pour regrouper simulations par intention d'achat (ex : "Colmar", "Mulhouse", "Strasbourg")
- simulateur decisionnel simple et rapide utilisable apres une visite
- saisie rapide : prix, type de bien, departement, mobilier, debours, travaux, financement, strategie, preparation optionnelle de lots
- resultats decisionnels calcules backend : cout total, marges brute et nette, rendement, mensualite, capital mobilise, duree, risque, score explicable
- estimation detaillee des frais de notaire calculee backend : base taxable, droits / TPF, contribution de securite immobiliere, debours et emoluments
- **recommandation claire par simulation : interessant / a negocier / trop risque**
- comparaison entre plusieurs simulations au sein d'un meme dossier pour decider
- **objectif zero double saisie** : reutilisation des donnees de simulation lors de la creation du projet reel (en cours d'amelioration)

**Pilotage apres achat :**
- projets convertis depuis simulation ou crees directement
- lots herites de la simulation ou crees apres achat
- depenses / factures
- documents
- KPI projet simples et fiables
- export CSV comptable simple

Le produit n'est ni un logiciel de gestion locative classique, ni un ERP immobilier, ni une usine a gaz de simulation financiere complexe.

## Etat du module simulation

Le **module de simulation decisionnelle avant achat** est partiellement implemente en premiere version fonctionnelle.

**Ce qui est en place :**
- dossiers d'opportunites pour structurer les simulations par intention d'achat
- creation et sauvegarde de plusieurs opportunites immobilieres visitees dans un dossier
- saisie strategie (revente ou locatif), prix, type de bien, departement, mobilier, debours, travaux par postes, financement
- formulaire creation / edition de simulation reorganise en 4 blocs simples (`Bien & contexte`, `Acquisition`, `Financement`, `Exploitation & securite`) pour accelerer la saisie et reduire l'effort mental
- pret auto-calcule cote front sur le formulaire, avec override manuel explicite et bouton de recalcul, sans deplacer la logique decisionnelle hors du backend
- preparation optionnelle de la structure de lots (appartements, garages, caves) pour anticiper le projet
- comparaison simple entre simulations au sein d'un meme dossier
- resultats decisionnels calcules backend
- calcul detaille des frais de notaire centralise dans `apps/api/src/simulations/simulation-notary-fees.util.ts`
- recommandation explicite par simulation : interessant / a negocier / trop risque
- conversion de base simulation vers projet avec reutilisation des donnees principales
- journal d'opportunite pour documenter evenements structurants (visite, negociation, changement hypothese)
- **options actives pour arbitrer avec donnees terrain reelles** :
  - gestion de plusieurs hypotheses par categorie (prix d'achat, travaux, financement)
  - creation manuelle ou depuis journal d'opportunite
  - activation explicite par l'utilisateur (pas de selection automatique)
  - calculs utilisent uniquement l'option active (fallback sur valeur initiale si aucune option)
  - **comparaison instantanee avant activation** : survol d'une option affiche automatiquement l'impact sur les resultats (cout, marge, mensualite, duree, score) avec deltas visuels (vert = amelioration, rouge = degradation)
  - **comparaison cote a cote durable** dans l'onglet Options pour lire plusieurs hypotheses d'un meme groupe en meme temps
  - **historique des activations** pour tracer les arbitrages utilisateur avec avant/apres, deltas et auteur du changement
  - onglet "Options" dans detail simulation avec UI selection radio buttons et badges "Actuel" / "Alternative"
  - onglet "Historique" dedie pour expliquer les choix successifs
  - bouton "Creer option" sur chaque evenement du journal

**Limites actuelles :**
- UX encore perfectible sur certains ecrans
- conversion simulation → projet presente mais a consolider dans tous les cas
- comparaison encore simple : un seul groupe a la fois, pas d'export comparatif, pas de vue multi-groupes
- mesure ecart previsionnel vs reel pas encore exploitable (pas de tableau de bord compare, pas d'alertes sur derives)

**Garde-fous respectes V1 :**
- moins de 15 champs critiques obligatoires
- saisie rapide utilisable apres une visite d'opportunite
- pas d'IA, pas de moteur expert, pas de cash-flow ultra detaille
- calculs simples, comprehensibles, explicables
- calculs centralises cote backend
- taux departementaux sur l'ancien geres via une configuration centralisee par code departement, basee sur la grille officielle DGFiP DMTO au 1er fevrier 2026
- statut primo-accedant stocke dans la simulation pour preparer la logique reglementaire, sans modulation automatique appliquee a ce stade

**Prochaines etapes prioritaires :**
- comparaison multi-groupes ou exportable pour partage avec partenaires et financeurs
- historique enrichi si besoin avec niveau de justification supplementaire
- mesure ecart previsionnel vs reel avec tableau de bord et alertes
- robustesse conversion avec preview et gestion cas limites
- scoring contextualise selon type operation et profil investisseur

## Feedback produit et beta

Le repo embarque maintenant une boucle de feedback volontairement simple :

- une boite a idees produit sur `/ideas`
- des votes limites a `1 user = 1 vote` par idee
- des statuts `OPEN / PLANNED / IN_PROGRESS / DONE / REJECTED`
- un message UX explicite : les votes aident a prioriser, ils ne decident pas automatiquement
- un programme `client pilote` base sur `isPilotUser` + `betaAccessEnabled`
- un espace beta reserve aux pilotes actifs pour les idees en validation

Choix multi-tenant :

- les idees et les votes sont scopes par `organizationId`
- l application produit ne prend jamais `organizationId` depuis le body
- le back-office admin garde une vue transverse pour la gestion interne

## Stack et architecture

- `apps/landing` : Next.js + TypeScript
- `apps/web` : React + Vite + TypeScript
- `apps/api` : NestJS + Prisma
- Base de donnees : PostgreSQL
- Architecture : monolithe modulaire multi-tenant

## Deploiements Vercel

- Web production : [https://axelys-web.vercel.app/](https://axelys-web.vercel.app/)
- API production : [https://axelys-api.vercel.app](https://axelys-api.vercel.app)
- Landing production :[https://axelys.vercel.app](https://axelys.vercel.app)

Notes utiles :

- l'application web Vite doit pointer vers `https://axelys-api.vercel.app/api` via `VITE_API_URL`
- l'API de production doit utiliser une `DATABASE_URL` poolée pour le runtime et une `DIRECT_URL` pour Prisma CLI / Studio
- la production ne doit pas utiliser de comptes seed ou de donnees de demonstration
- les comptes seed du repo restent reserves au local et aux tests

## Variables Vercel

Projet Vercel `axelys-api` :

- `DATABASE_URL` : URL Prisma Postgres poolée pour le runtime
- `DIRECT_URL` : URL Prisma Postgres directe pour `prisma migrate deploy` et Prisma Studio
- `JWT_SECRET` : secret JWT long et aleatoire
- `APP_WEB_URL` : URL publique de `apps/web`, utilisee dans les emails d invitation admin
- `USER_INVITATION_TTL_HOURS` : duree de validite d un lien d invitation
- `MAIL_FROM` : expediteur transactionnel utilise par SMTP ou Resend
- `SMTP_HOST` : serveur SMTP optionnel
- `SMTP_PORT` : port SMTP optionnel
- `SMTP_USER` : identifiant SMTP optionnel
- `SMTP_PASS` : secret SMTP optionnel
- `SMTP_SECURE` : force le mode secure SMTP si besoin
- `RESEND_API_KEY` : cle API Resend optionnelle si SMTP n est pas configure

Valeurs de reference :

```env
DATABASE_URL=postgres://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require&pool=true
DIRECT_URL=postgres://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
APP_WEB_URL=https://axelys-web.vercel.app
USER_INVITATION_TTL_HOURS=72
# MAIL_FROM="Axelys <votre-adresse@gmail.com>"
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT=465
# SMTP_USER="votre-adresse@gmail.com"
# SMTP_PASS="mot-de-passe-d-application"
# SMTP_SECURE=true
# RESEND_API_KEY=re_xxx
```

Projet Vercel `axelys-web` :

- `VITE_API_URL` : URL publique de l'API avec le prefixe `/api`

Valeur de reference :

```env
VITE_API_URL=https://axelys-api.vercel.app/api
```

Fichiers helper :

- `apps/api/.env.prod` : helper local pret a copier-coller pour `axelys-api`
- `apps/api/.env.prod.example` : template versionne pour les futurs setups
- `apps/web/.env.prod` : helper local pret a copier-coller pour `axelys-web`
- `apps/web/.env.prod.example` : template versionne pour les futurs setups

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

## Comptes de demo locaux

Apres le seed Prisma :

- `admin@example.com` / `admin123` : compte `SUPER_ADMIN`, acces a l'application produit et au back-office `/admin`, utilisateur pilote avec acces beta
- `user@example.com` / `user123` : utilisateur standard, acces a l'application produit

Le seed ajoute aussi deux idees de demonstration dans `demo-org` pour verifier rapidement la page `/ideas` et le panneau beta pilote.

Ces comptes sont uniquement destines au developpement local et aux tests. Ils ne doivent pas etre recrees ni utilises en production.

## Invitation admin des utilisateurs

Le MVP n expose aucun signup public et n envoie jamais les invites vers la landing.
Le back-office `/admin` permet maintenant de :

- inviter un utilisateur avec `email + role membership` vers :
  - une organisation existante
  - ou un espace personnel
- envoyer un lien unique vers `apps/web` sur `/setup-password`
- laisser l invite definir son mot de passe si le compte est nouveau
- rattacher le membership cible au moment de l acceptation
- tracer invitation initiale et renvois dans l audit log admin
- rester strictement multi-tenant : un utilisateur solo obtient aussi une vraie `Organization` technique

Comportement utile :

- si des organisations existent, l admin peut choisir entre organisation existante et espace personnel
- si aucune organisation n existe encore, l invitation reste possible et cree un espace personnel a l activation
- l organisation personnelle est creee au moment de l acceptation du lien, pour eviter des tenants inutiles sur des invitations jamais activees

Notes utiles :

- aucun signup public n est ajoute ; le flow reste admin-driven de bout en bout
- en local, sans provider configure, l API journalise l email d invitation dans les logs pour rester exploitable sans service externe
- le module mail choisit son transport dans cet ordre :
  1. SMTP si `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` et `MAIL_FROM` sont definis
  2. Resend si `RESEND_API_KEY` et `MAIL_FROM` sont definis
  3. fallback console sinon
- Gmail fonctionne en SMTP simple avec `smtp.gmail.com`, le port `465` et un mot de passe d application
- le login existant reste en place ; l activation redirige ensuite vers `/login`

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
- [Feedback produit et clients pilotes](docs/feedback-produit-pilotes.md)
- [Regles projet IA](AGENTS.md)
