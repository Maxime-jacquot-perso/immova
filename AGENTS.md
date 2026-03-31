# AGENTS

Ce fichier est le referentiel de travail IA du projet.
Il doit etre lu au debut de chaque session et mis a jour quand une decision structurelle ou fonctionnelle evolue.

## 1. Identite produit

- Produit : SaaS de pilotage d'operations immobilieres
- Cible prioritaire : investisseurs immobiliers, marchands de biens, petites structures multi-projets
- Le produit n'est pas un logiciel de gestion locative classique
- Le produit n'est pas un ERP immobilier

## 2. Coeur produit

Le coeur du produit est strictement :

- projets
- lots
- depenses / factures
- documents
- KPI projet simples et fiables
- export CSV comptable simple

## 3. MVP visible actuel

Le MVP visible doit rester limite a :

- authentification
- dashboard global portefeuille
- organisation courante
- memberships et roles simples
- projets
- lots
- depenses
- documents
- dashboard projet
- export CSV

## 4. Hors MVP visible

Ne pas remettre dans le scope sans validation explicite :

- gestion locative avancee
- locataires
- occupation detaillee
- wizard d'onboarding dedie ou nouvelle route d'onboarding
- timeline riche
- simulation complexe
- cash-flow reel
- reporting portefeuille avance
- generation de baux
- signature electronique
- OCR avance
- rapprochement bancaire
- comptabilite generale
- permissions fines cote application utilisateur
- workflow de validation
- automatisations avancees

## 5. Regles architecture

- Monorepo simple avec `apps/landing`, `apps/web` et `apps/api`
- Landing marketing : Next.js + TypeScript
- App produit : React + Vite + TypeScript
- Backend : NestJS modulaire
- Base : PostgreSQL
- ORM : Prisma
- Monolithe modulaire uniquement
- Pas de microservices
- Pas de CQRS lourd
- Back-office admin interne dans `apps/web` sous `/admin` avec layout separe de l'application utilisateur
- API admin dediee sous `/api/admin/*` avec guards, permissions et audit log distincts des routes produit
- RBAC admin global porte par `User.adminRole` avec mapping `role -> permissions` centralise cote backend pour rester simple sur le MVP

## 6. Regles multi-tenant

- Toutes les tables metier portent `organizationId`
- Aucun endpoint ne prend un `organizationId` libre dans le body
- Le `organizationId` vient du contexte authentifie
- Toutes les requetes Prisma business filtrent par `organizationId`
- Les documents doivent aussi etre cloisonnes par `organizationId`

## 7. Regles produit

- Si une fonctionnalite n'aide pas directement a saisir ou piloter un projet, elle sort
- Aucun KPI ne doit etre affiche sans source fiable
- Pas de KPI "marketing"
- Le detail projet est le centre de gravite de l'application
- La simplicite UI prime sur la preparation de features futures

## 8. Modele de donnees V1

Entites obligatoires :

- `Organization`
- `User`
- `Membership`
- `Project`
- `Lot`
- `Expense`
- `Document`

Entites repoussees :

- `Vendor`
- `ExpenseAllocation`
- `Tenant`
- `Occupancy`
- `TimelineEvent`
- `ProjectScenario`

## 9. Ecrans MVP

- `/dashboard`
- `/login`
- `/projects`
- `/projects/new`
- `/projects/:projectId`
- `/projects/:projectId/lots`
- `/projects/:projectId/expenses`
- `/projects/:projectId/documents`
- `/projects/:projectId/export`
- `/settings`

## 10. Conventions de code

- Code sobre, lisible, sans sur-abstraction
- Dossiers structures par domaine
- Validation DTO / schemas des deux cotes
- Calculs KPI cote backend
- Score de completude, alertes metier, suggestions d'action et statut decisionnel centralises cote backend
- Pas de logique produit dupliquee entre front et back
- Etats de chargement, erreur, feedback et empty state harmonises via des composants UI partages legers
- La CI GitHub Actions doit rester progressive : un workflow principal limite a l'installation, au lint et au build ; les checks plus lourds vivent dans des workflows separes
- Les commandes de lint de verification ne doivent pas modifier le code ; les auto-fix doivent rester explicites

## 11. Structure du repo

- `apps/landing` : landing marketing Next.js
- `apps/web` : application React + Vite
- `apps/api` : API NestJS + Prisma
- `.github/workflows` : workflows GitHub Actions du monorepo
- `docs/` : cadrage produit et MVP
- `docker-compose.yml` : PostgreSQL local standard si Docker est disponible

Structure frontend :

- `src/app` : routing, providers, layout
- `src/modules/auth` : login et session
- `src/modules/projects` : liste projets, detail projet, overview, export, API projet
- `src/modules/lots` : gestion lots dans un projet
- `src/modules/expenses` : gestion depenses dans un projet
- `src/modules/documents` : upload et consultation documents
- `src/modules/settings` : organisation courante et membres
- `src/modules/admin` : back-office interne, dashboard admin, users, admins, audit
- `src/shared` : client API, UI minimale

Structure backend :

- `src/auth`
- `src/organizations`
- `src/memberships`
- `src/projects`
- `src/lots`
- `src/expenses`
- `src/documents`
- `src/exports`
- `src/prisma`
- `src/storage`
- `src/common`
- `src/admin`

## 12. Features existantes

Back :

- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/organizations/current`
- `GET/POST/PATCH /api/memberships`
- `GET/POST/PATCH /api/projects`
- `GET /api/projects/:projectId/overview`
- `GET/POST/PATCH /api/projects/:projectId/lots`
- `GET/POST/PATCH /api/projects/:projectId/expenses`
- `GET/POST /api/projects/:projectId/documents`
- `GET /api/projects/:projectId/documents/:documentId/download`
- `GET /api/projects/:projectId/exports/expenses.csv`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/users/:userId`
- `PATCH /api/admin/users/:userId/suspend`
- `PATCH /api/admin/users/:userId/reactivate`
- `PATCH /api/admin/users/:userId/grant-trial`
- `PATCH /api/admin/users/:userId/extend-trial`
- `PATCH /api/admin/users/:userId/subscription`
- `PATCH /api/admin/users/:userId/change-role`
- `GET /api/admin/admins`
- `POST /api/admin/admins`
- `PATCH /api/admin/admins/:userId/change-role`
- `GET /api/admin/audit-logs`

Front :

- login
- dashboard global portefeuille
- comparaison simple entre projets sur le dashboard global
- score de completude / fiabilite partage entre dashboard global et overview projet
- alertes metier hierarchisees `critical / warning / info` sur dashboard global et overview projet
- suggestions d'action concretes partagees entre dashboard global et overview projet
- statut decisionnel projet visible sur dashboard global, overview projet et liste projets
- liste projets
- creation projet
- edition projet
- archivage projet
- detail projet
- overview projet oriente decision avec resume de pilotage, bloc a surveiller et bloc donnees manquantes / fiabilite
- empty states utiles sur projets, overview, lots, depenses, documents et export
- feedbacks utilisateur harmonises sur creation, edition, archivage, upload, export et ajout membre
- etats de chargement et d'erreur harmonises sur les ecrans MVP web
- validations front renforcees et messages de formulaire visibles sur projets, lots, depenses, documents et settings
- affichage KPI front securise contre valeurs invalides, nulles ou non fiables
- lots
- edition lot
- archivage lot
- depenses
- edition depense
- ajout de justificatif directement depuis le formulaire depense
- documents
- filtres documents
- export CSV
- settings organisation / membres
- back-office admin interne distinct sous `/admin`
- dashboard admin avec synthese comptes, essais, suspensions, repartition des roles admin et actions recentes
- listing admin des utilisateurs avec recherche, filtres, pagination et badges d'etat
- detail utilisateur admin avec organisations rattachees, historique admin recent et actions sensibles auditees
- gestion admin des essais, des suspensions/reactivations, des statuts d'abonnement et des roles admin avec motif obligatoire
- gestion des administrateurs avec creation de compte interne et changement de role selon le niveau autorise
- audit log admin exploitable depuis l'UI interne
- landing marketing Next.js avec hero, sections marketing, pricing, FAQ et SEO de base
- route error boundary pour eviter l'ecran technique React Router
- tests e2e API des flows critiques MVP
- smoke tests UI Playwright : login, projet, lot, depense, document, export et settings
- workflow GitHub Actions `ci.yml` pour installation, lint et build du monorepo sur `push` et `pull_request` vers `main`
- workflow GitHub Actions `e2e-api.yml` separe pour `pnpm test:e2e:api` avec PostgreSQL de CI

## 13. Etat actuel

- Le repo est scaffolded en monorepo avec `apps/landing`, `apps/web` et `apps/api`
- Le backend expose deja : auth, dashboard global, organization courante, memberships, projects, lots, expenses, documents, exports CSV
- Le frontend expose deja : login, dashboard global, liste projets, creation projet, detail projet, lots, depenses, documents, export, settings
- Un back-office admin interne distinct est maintenant expose dans `apps/web` sous `/admin`, avec un layout separe et des pages dediees `dashboard / users / admins / audit-logs`
- L'API expose maintenant un domaine admin dedie sous `/api/admin/*` avec controllers/services separes de l'API produit
- Le modele `User` porte desormais un `adminRole` global, le statut de suspension, les informations d'essai, le statut/plan d'abonnement et la date de derniere connexion
- Les permissions admin sont verifiees cote backend sur chaque route sensible via guards et decorators dedies, l'UI ne fait qu'une adaptation d'affichage
- Les changements sensibles admin sont traces dans `AdminAuditLog` avec acteur, cible, motif, avant/apres et metadata de requete
- Les garde-fous admin couvrent notamment : impossibilite de suspendre son propre compte, impossibilite de changer son propre role admin, blocage de la suppression/degradation du dernier `SUPER_ADMIN`, restrictions d'elevation pour `ADMIN` et limites de trial par role
- La landing marketing Next.js a ete refondue avec un message plus concret, un hero probleme/promesse, des sections marketing completes, un pricing plus credible et une FAQ visible
- La landing marketing embarque des metadata SEO, Open Graph, Twitter et du JSON-LD `SoftwareApplication` + `FAQPage`
- Le pricing initial affiche `Free`, `Pro` a `29 EUR` et `Business` a `59 EUR`
- Le detail des fonctionnalites par offre reste a arbitrer, mais la logique de niveaux d acces par plan est actee
- Le choix cible pour les paiements futurs est Revolut, documente sans implementation a ce stade
- Le dashboard global est la page d'entree post-login et synthetise le portefeuille avec agregats fiables, alertes utiles, projets a surveiller et activite recente
- Le dashboard global s'appuie sur un endpoint backend dedie et sur une base de calcul KPI partagee avec l'overview projet pour eviter la duplication de logique
- Le backend centralise desormais, pour chaque projet, les KPI, le score de completude / fiabilite, les donnees manquantes, les alertes metier hierarchisees, les suggestions d'action et le statut decisionnel
- Le score de completude / fiabilite projet repose uniquement sur les donnees MVP presentes : prix achat, frais d'acquisition, budget travaux, lots, surfaces, loyers estimes, depenses et documents
- Le statut decisionnel projet suit une logique simple et explicable : `OK` sans alerte critique ni warning, `A surveiller` si completude moyenne ou alertes warning, `Problematique` en presence d'alerte critique ou de completude tres faible
- L'overview projet est desormais oriente decision avec un resume de pilotage, des alertes triees par gravite, des suggestions d'action et un bloc explicite des donnees manquantes
- Les projets a surveiller du dashboard global sont maintenant tries d'abord par alertes critiques, puis par completude la plus faible, puis par mise a jour recente
- Le dashboard global ajoute une comparaison simple entre projets actifs et des actions prioritaires pour les projets critiques
- Les listes projet, lots et depenses ont des filtres simples cote UI
- Les listes projet et lots peuvent masquer les archives par defaut
- Les projets et lots peuvent etre archives rapidement depuis l'UI
- La liste projets affiche un badge de statut decisionnel sans ajouter de nouvelle navigation ni de nouvelle entite
- L'UX de lancement web guide desormais l'utilisateur avec des empty states metier sans ajouter de nouveau flow ni de nouvelle route
- Les documents ont des filtres simples par texte, type et depense liee
- Une depense peut uploader un justificatif au moment de la creation ou de l'edition
- Une boundary d'erreur routee evite l'ecran d'erreur technique par defaut en cas de crash front
- Les ecrans MVP web partagent des retours utilisateur coherents pour creation, edition, archivage, upload, export et ajout de membre
- Les KPI affiches cote front sont proteges contre les valeurs nulles, invalides ou inexploitable
- Les formulaires web remontent maintenant les erreurs de validation de facon visible sur les champs critiques
- Le setup local DB passe par `docker-compose.yml`
- Le setup local alternatif fonctionne avec un PostgreSQL local si Docker n'est pas demarre
- Le repo est maintenant prepare pour une publication GitHub propre avec un `.gitignore` monorepo renforce pour `.env`, `node_modules`, `dist`, `.next`, `coverage`, `uploads`, temporaires de tests et volumes locaux
- Les fichiers runtime suivis sous `apps/api/uploads` ont ete identifies comme artefacts generes et doivent rester hors du versioning
- Le README racine et les README de `apps/api` / `apps/web` ont ete remis en coherence pour decrire le monorepo reel plutot que les templates d'origine
- Une CI GitHub Actions progressive est maintenant en place sous `.github/workflows` avec un workflow principal `ci.yml` pour `install + lint + build`
- Le workflow `e2e-api.yml` lance `pnpm test:e2e:api` sur PostgreSQL GitHub Actions et reste separe de la CI de base pour conserver un feedback rapide
- Les commandes locales equivalentes au socle CI sont `pnpm lint` et `pnpm build`, avec `pnpm test:e2e:api` pour le workflow backend dedie
- Le lint API de verification n'applique plus `--fix` implicitement ; l'auto-fix passe par une commande dediee
- Build front et back : OK
- Migration Prisma initiale : OK
- Migration Prisma `admin_backoffice` : ajoutee
- Seed local : OK
- Deux comptes seed locaux sont disponibles pour les tests : `admin@example.com` / `admin123` en `SUPER_ADMIN` et `user@example.com` / `user123` en utilisateur standard
- Tests e2e API : OK
- Smoke tests UI Playwright : en place
- Couverture Playwright actuelle : login, dashboard global, navigation dashboard vers projet, comparaison projets, statut decisionnel, suggestions d'action, empty state projets, creation projet, empty states d'un projet neuf, edition / archivage projet, creation lot, edition / archivage lot, creation depense avec justificatif, edition depense, verification du score de completude / fiabilite et des alertes dans l'overview, export CSV, verification document lie, upload document manuel, settings / ajout membre
- Validation rejouee pendant cette session : audit CI monorepo, `pnpm lint`, `pnpm build`, `pnpm test:e2e:api` = OK
- Tests non relances pendant cette session : `test:e2e:web`
- Les documents de cadrage vivent dans `docs/`

## 14. Demarrage local de reference

- Lancer la landing : `pnpm dev:landing`
- Copier `apps/api/.env.example` vers `apps/api/.env`
- Adapter `DATABASE_URL` si le PostgreSQL local n'utilise pas l'utilisateur `postgres`
- Lancer migration et seed dans `apps/api`
- Login demo seed admin : `admin@example.com` / `admin123`
- Login demo seed utilisateur : `user@example.com` / `user123`
- Commandes equivalentes a la CI de base : `pnpm lint` puis `pnpm build`
- Commande tests e2e API : `pnpm test:e2e:api`
- Commande tests UI Playwright : `pnpm test:e2e:web`
- Base e2e par defaut : `immo_ops_e2e`
- Si besoin : definir `DATABASE_URL_E2E`
- Le setup e2e refuse de reset une base qui ne contient pas `e2e`

## 15. Regle de mise a jour

A la fin de chaque session significative, mettre a jour :

- l'etat actuel
- les features existantes
- les decisions d'architecture actees
- les points explicitement hors scope
