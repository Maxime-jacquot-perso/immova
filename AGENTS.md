# AGENTS

Ce fichier est le referentiel de travail IA du projet.
Il doit etre lu au debut de chaque session et mis a jour quand une decision structurelle ou fonctionnelle evolue.

## 1. Identite produit

- Produit : SaaS de decision et de pilotage d'operations immobilieres
- Cible prioritaire : investisseurs immobiliers, marchands de biens, petites structures multi-projets
- Le produit couvre desormais 2 temps :
  - **Avant achat** : arbitrer entre plusieurs opportunites immobilieres en simulant, comparant et decidant via un simulateur decisionnel simple
  - **Apres achat** : mesurer l'ecart entre hypothese initiale et realite terrain en pilotant, suivant et corrigeant via projets, lots, depenses, documents et KPI
- **Promesse produit centrale** : zero double saisie entre simulation et projet reel grace a la conversion automatique des donnees
- Le produit n'est pas un logiciel de gestion locative classique
- Le produit n'est pas un ERP immobilier
- Le produit n'est pas une usine a gaz de simulation financiere complexe

## 2. Coeur produit

Le coeur du produit couvre maintenant :

**Decision avant achat :**
- simulations decisionnelles simples regroupees par dossiers d'opportunites
- comparaison entre opportunites au sein d'un meme dossier
- resultats decisionnels calcules backend : cout total, fonds propres, marges brute et nette, rendement, mensualite, capital mobilise, duree projet, indicateurs de risque, score explicable
- frais de notaire estimes calcules backend avec detail explicable : droits / TPF, CSI, debours et emoluments par tranches
- recommandation claire par simulation : `interessant` / `a negocier` / `trop risque`
- conversion simulation retenue vers projet reel sans ressaisie manuelle

**Pilotage apres achat :**
- projets
- lots
- depenses / factures
- documents
- KPI projet simples et fiables
- export CSV comptable simple

## 3. MVP visible actuel et suite prioritaire

**MVP visible actuel** (pilotage apres achat) :

- authentification
- dashboard global portefeuille
- organisation courante
- memberships et roles simples
- projets
- lots
- depenses
- documents
- dashboard projet
- bloc `Previsionnel vs reel` sur projet converti avec snapshot disponible
- export CSV

**Suite prioritaire actee** :

- module de simulation decisionnelle
- dossiers d'opportunites pour regrouper plusieurs simulations par intention d'achat
- creation et sauvegarde de simulations d'opportunites avant achat
- preparation optionnelle et simplifiee de la structure de lots dans la simulation
- comparaison entre plusieurs simulations au sein d'un meme dossier
- resultats decisionnels simples et fiables calcules backend
- recommandation explicite par simulation : interessant / a negocier / trop risque
- conversion d'une simulation retenue en projet reel sans ressaisie manuelle complete
- lecture simple et exploitable de l'ecart `previsionnel vs reel`
- alertes de derive simples, explicables et actionnables

## 4. Hors scope explicite

Ne pas remettre dans le scope sans validation explicite :

**Hors scope simulateur V1 :**
- IA
- moteur de scenarios avances ou multiples
- simulation bancaire complexe
- cash-flow expert ultra detaille
- wizard d'onboarding dedie si cela complexifie fortement l'app
- duplication de logique produit entre front et back
- plus de 15 champs critiques obligatoires dans le formulaire de simulation

**Garde-fous simulateur V1 :**
- moins de 15 champs critiques obligatoires
- saisie rapide utilisable apres une visite d'opportunite
- calculs simples, comprehensibles, explicables
- pas de moteur de scenarios multiples
- pas de complexite inutile

**Hors scope pilotage actuel :**
- gestion locative avancee
- locataires
- occupation detaillee
- timeline riche
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

**Domaines publics et liens externes de reference :**

- domaine principal public : `https://axelys.app`
- application produit : `https://app.axelys.app`
- API publique : `https://api.axelys.app`
- expediteur transactionnel cible : `Axelys <no-reply@axelys.app>`
- la landing garde `https://axelys.app` comme URL canonique et source de verite pour metadata, sitemap, robots et Open Graph
- tout lien utilisateur genere par le backend (invitation, setup-password, reset futur, callback visible, notification) doit pointer vers `APP_WEB_URL`, donc vers `https://app.axelys.app` en production
- les futurs liens externes, callbacks, URLs absolues et emails ne doivent jamais introduire une URL en dur si une variable dediee existe deja (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `API_URL`, `APP_WEB_URL`, `ALLOWED_ORIGINS`, `VITE_API_URL`, `MAIL_FROM`)

## 6. Regles multi-tenant

- Toutes les tables metier portent `organizationId`
- Aucun endpoint ne prend un `organizationId` libre dans le body
- Le `organizationId` vient du contexte authentifie
- Toutes les requetes Prisma business filtrent par `organizationId`
- Les documents doivent aussi etre cloisonnes par `organizationId`

## 7. Regles produit

- Le produit aide a decider avant achat puis a piloter apres achat
- Si une fonctionnalite n'aide ni a decider ni a piloter, elle sort
- Aucun KPI ne doit etre affiche sans source fiable
- Pas de KPI "marketing"
- Les calculs decisionnels et de pilotage restent simples, explicables et rapides a remplir
- Le simulateur V1 doit rester simple : pas d'IA, pas de moteur expert, pas de cash-flow ultra detaille
- Le detail projet reste le centre de gravite de l'application apres achat
- La simplicite UI prime sur la preparation de features futures

**Doctrine produit issue de l'analyse critique :**

- **Alerte utile = alerte anticipative** : une alerte produit doit permettre d'anticiper un probleme, pas seulement de decrire un etat post-mortem
- **Friction de saisie = risque critique produit** : toute friction inutile dans la saisie menace directement l'adoption et l'usage reel du produit
- **Score toujours contextualise et explicable** : un score de completude ou de fiabilite doit etre adapte au type de projet et toujours explicable par l'utilisateur
- **Aucun indicateur sans impact decisionnel** : un KPI ou indicateur affiche doit directement aider a prendre une decision ou corriger une action, sinon il sort
- **Zero double saisie** : aucune ressaisie manuelle complete ne doit etre necessaire entre simulation et projet reel ; la conversion doit reutiliser les donnees existantes

## 8. Modele de donnees V1

Entites obligatoires (pilotage actuel) :

- `Organization`
- `User`
- `Membership`
- `Project`
- `Lot`
- `Expense`
- `Document`

Entites additionnelles activees pour le feedback produit MVP :

- `FeatureRequest`
- `FeatureRequestVote`

Entites additionnelles actives pour la conversion robuste et le suivi previsionnel :

- `SimulationConversion` : trace la conversion effective d'une simulation vers un projet, avec acteur, date et statut ; constitue la source de verite metier de la conversion
- `ProjectForecastSnapshot` : fige les hypotheses previsionnelles au moment de la conversion pour servir de reference immutable

**Entites prevues / prioritaires (decision avant achat) :**

- `SimulationFolder` : entite dediee pour regrouper des opportunites par intention d'achat
  - doit porter `organizationId` pour rester strictement multi-tenant
  - permet de regrouper plusieurs simulations liees a une meme zone geographique ou intention d'investissement
  - exemples : dossier "Colmar", dossier "Mulhouse", dossier "Strasbourg centre"
  - la comparaison entre simulations se fait a l'interieur d'un meme dossier
  - role produit : eviter la confusion entre dizaines de simulations non structurees

- `Simulation` : entite dediee pour sauvegarder et comparer des opportunites immobilieres avant achat
  - doit porter `organizationId` pour rester strictement multi-tenant
  - doit porter `simulationFolderId` pour rattachement a un dossier d'opportunites
  - doit couvrir : nom projet/opportunite, strategie (revente ou locatif), prix achat, type de bien (`ANCIEN` / `NEUF_VEFA`), code departement, statut primo-accedant, mobilier deduit, debours estimes, frais de notaire calcules et detailles, travaux estimes, detail postes, financement (cash ou credit), apport, taux, duree pret, fin chantier estimee, prix revente cible ou loyer cible
  - **peut contenir une structure simplifiee de lots** (appartements, garages, caves) de facon optionnelle et non obligatoire pour anticiper la structure du projet et eviter la ressaisie apres achat
  - doit permettre la comparaison entre plusieurs simulations au sein d'un meme dossier
  - doit calculer cote backend : cout total, fonds propres mobilises, mensualite estimee, marge brute, marge nette simplifiee, rendement brut si locatif, effort mensuel, duree projet estimee, statut decisionnel, indicateurs de risque/tension, score explicable
  - doit produire une recommandation claire : `interessant` / `a negocier` / `trop risque`
  - **convertit une seule fois vers un `Project` reel si l'opportunite est retenue, sans ressaisie manuelle complete**
  - la conversion reutilise les donnees existantes, la structure de lots preparee si elle existe, puis cree un snapshot previsionnel immutable de reference

- `SimulationLot` : entite optionnelle pour preparer la structure de lots d'une simulation
  - doit porter `organizationId` et `simulationId` pour rester strictement multi-tenant
  - doit porter un champ `type` avec enum `SimulationLotType` : `APARTMENT`, `GARAGE`, `CELLAR`, `OTHER`
  - permet d'anticiper la structure du projet sans obliger la saisie complete avant decision
  - converti automatiquement en `Lot` reel lors de la conversion simulation vers projet

- `OpportunityEvent` : entite pour journaliser les evenements structurants d'une opportunite avant achat
  - doit porter `organizationId` et `simulationId` pour rester strictement multi-tenant
  - doit porter un champ `type` avec enum `OpportunityEventType` : `NEGOTIATION_PRICE`, `BANK_FINANCING_QUOTE`, `VISIT_NOTE`, `RISK_ALERT`, `ASSUMPTION_CHANGE`, `OTHER`
  - permet de tracker visite, negociation prix, devis banque, alerte risque, changement hypothese sans alourdir le formulaire principal
  - reste leger et optionnel : pas de complexite inutile, pas de workflow, juste une trace chronologique utile

- `SimulationOptionGroup` : entite pour regrouper des options par type d'hypothese (prix, travaux, financement)
  - doit porter `organizationId` et `simulationId` pour rester strictement multi-tenant
  - doit porter un champ `type` avec enum `SimulationOptionGroupType` : `PURCHASE_PRICE`, `WORK_BUDGET`, `FINANCING`
  - porte `activeOptionId` nullable pour identifier l'option actuellement active
  - permet de gerer plusieurs hypotheses pour une meme categorie (ex: 3 offres de prix differentes)
  - **une seule option peut etre active par groupe** (activation explicite par l'utilisateur)

- `SimulationOption` : entite pour stocker une hypothese alternative (option)
  - doit porter `organizationId` et `groupId` pour rester strictement multi-tenant
  - porte `label` (ex: "Offre 240k", "Menuisier 1", "Banque CIC")
  - porte `valueJson` (structure libre selon le type : prix, cout, taux, duree, etc.)
  - porte `isActive` (booleen synchronise avec `SimulationOptionGroup.activeOptionId`)
  - porte `source` avec enum `SimulationOptionSource` : `MANUAL` (saisie directe) ou `FROM_EVENT` (creee depuis journal)
  - porte `sourceEventId` nullable pour lier une option a un evenement du journal
  - **activation explicite par l'utilisateur** : pas de selection automatique du "meilleur choix"
  - **les calculs utilisent uniquement l'option active** (fallback sur valeur initiale simulation si aucune option active)

- `Project` : entite centrale du pilotage apres achat
  - porte desormais `strategy` quand il provient d'une conversion de simulation
  - peut porter un lien 1:1 avec `SimulationConversion` et `ProjectForecastSnapshot` pour le suivi `previsionnel vs reel`
  - `convertedProjectId` cote `Simulation` reste un raccourci de lecture / compatibilite, sans remplacer `SimulationConversion` comme source de verite

Entites repoussees :

- `Vendor`
- `ExpenseAllocation`
- `Tenant`
- `Occupancy`
- `TimelineEvent`
- `ProjectScenario` (remplace conceptuellement par `Simulation` pour la partie decision avant achat)

## 9. Ecrans MVP et ecrans prevus

**Ecrans MVP actuels (pilotage apres achat) :**

- `/dashboard`
- `/login`
- `/setup-password`
- `/projects`
- `/projects/new`
- `/projects/:projectId`
- `/projects/:projectId/lots`
- `/projects/:projectId/expenses`
- `/projects/:projectId/documents`
- `/projects/:projectId/export`
- `/ideas`
- `/settings`

**Ecrans prevus / prioritaires (decision avant achat) :**

- `/simulations` : liste des dossiers d'opportunites avec acces aux simulations regroupees par dossier
- `/simulations/folders/new` : creation d'un nouveau dossier d'opportunites
- `/simulations/folders/:folderId` : vue d'un dossier avec liste des simulations associees et comparaison simple entre simulations du meme dossier
- `/simulations/new` : creation d'une nouvelle simulation d'opportunite dans un dossier existant
- `/simulations/:simulationId` : detail d'une simulation avec resultats decisionnels, recommandation explicite, possibilite d'edition, preparation optionnelle de lots, preview de conversion et action de conversion en projet reel

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
- `src/modules/auth` : login, session et activation invitation
- `src/modules/projects` : liste projets, detail projet, overview, export, API projet
- `src/modules/lots` : gestion lots dans un projet
- `src/modules/expenses` : gestion depenses dans un projet
- `src/modules/documents` : upload et consultation documents
- `src/modules/settings` : organisation courante et membres
- `src/modules/ideas` : boite a idees produit, votes et lecture beta pilote
- `src/modules/admin` : back-office interne, dashboard admin, users, admins, audit
- `src/modules/simulations` : dossiers d'opportunites, liste simulations, creation, edition, detail, comparaison, options actives, historique de decision et conversion vers projet
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
- `src/ideas`
- `src/admin`
- `src/invitations`
- `src/mail`
- `src/simulations` : controller, service, DTO, calculs decisionnels backend (simulation-metrics.util.ts) pour opportunites avant achat, logique de conversion Simulation vers Project
- `src/simulation-folders` : controller, service, DTO pour gestion des dossiers d'opportunites

## 12. Features existantes

Back :

- `POST /api/auth/login`
- `GET /api/auth/invitations/verify`
- `POST /api/auth/invitations/accept`
- `GET /api/dashboard`
- `GET /api/dashboard/drifts`
- `GET /api/organizations/current`
- `GET/POST/PATCH /api/memberships`
- `GET/POST/PATCH /api/projects`
- `GET /api/projects/:projectId/overview` avec bloc `forecastComparison` si un snapshot previsionnel existe
- `GET/POST/PATCH /api/projects/:projectId/lots`
- `GET/POST/PATCH /api/projects/:projectId/expenses`
- `GET/POST /api/projects/:projectId/documents`
- `GET /api/projects/:projectId/documents/:documentId/download`
- `GET /api/projects/:projectId/exports/expenses.csv`
- `GET /api/ideas`
- `GET /api/ideas/beta`
- `POST /api/ideas`
- `POST /api/ideas/:featureRequestId/vote`
- `DELETE /api/ideas/:featureRequestId/vote`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/users/organizations/options`
- `POST /api/admin/users/invite` avec `organizationMode = existing | personal`
- `GET /api/admin/users/:userId`
- `POST /api/admin/users/invitations/:invitationId/resend`
- `PATCH /api/admin/users/:userId/suspend`
- `PATCH /api/admin/users/:userId/reactivate`
- `PATCH /api/admin/users/:userId/grant-trial`
- `PATCH /api/admin/users/:userId/extend-trial`
- `PATCH /api/admin/users/:userId/subscription`
- `PATCH /api/admin/users/:userId/change-role`
- `PATCH /api/admin/users/:userId/pilot-access`
- `GET /api/admin/ideas`
- `PATCH /api/admin/ideas/:featureRequestId/status`
- `GET /api/admin/admins`
- `POST /api/admin/admins`
- `PATCH /api/admin/admins/:userId/change-role`
- `GET /api/admin/audit-logs`
- `GET /api/simulation-folders`
- `POST /api/simulation-folders`
- `GET /api/simulation-folders/:folderId`
- `PATCH /api/simulation-folders/:folderId`
- `POST /api/simulation-folders/:folderId/archive`
- `GET /api/simulations/folders/:folderId/simulations`
- `POST /api/simulations`
- `GET /api/simulations/:simulationId`
- `GET /api/simulations/:simulationId/conversion-preview`
- `PATCH /api/simulations/:simulationId`
- `POST /api/simulations/:simulationId/archive`
- `GET /api/simulations/folders/:folderId/comparison`
- `POST /api/simulations/:simulationId/convert-to-project` avec blocage explicite si une conversion existe deja (`409` si deja convertie, `422` pour les autres blocages metier)
- `GET /api/simulations/:simulationId/lots`
- `POST /api/simulations/:simulationId/lots`
- `PATCH /api/simulations/:simulationId/lots/:lotId`
- `DELETE /api/simulations/:simulationId/lots/:lotId`
- `GET /api/simulations/:simulationId/events`
- `POST /api/simulations/:simulationId/events`
- `PATCH /api/simulations/:simulationId/events/:eventId`
- `DELETE /api/simulations/:simulationId/events/:eventId`
- `GET /api/simulations/:simulationId/option-groups`
- `POST /api/simulations/:simulationId/option-groups`
- `POST /api/simulations/:simulationId/options`
- `PATCH /api/simulations/:simulationId/options/:optionId/activate`
- `GET /api/simulations/:simulationId/options/:optionId/impact`
- `DELETE /api/simulations/:simulationId/options/:optionId`
- `GET /api/simulations/:simulationId/options/activation-history`
- `GET /api/simulations/:simulationId/options/groups/:groupId/comparison`

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
- boite a idees produit simple avec creation, liste, tri, filtre, vote et retrait de vote
- message UX explicite rappelant que les votes signalent sans decider automatiquement la roadmap
- badge beta visible sur les idees `IN_PROGRESS`
- settings organisation / membres
- badge utilisateur `Pilote` et indication d acces beta dans l app produit
- back-office admin interne distinct sous `/admin`
- dashboard admin avec synthese comptes, essais, suspensions, repartition des roles admin et actions recentes
- listing admin des utilisateurs avec recherche, filtres, pagination et badges d'etat
- detail utilisateur admin avec organisations rattachees, invitations, historique admin recent et actions sensibles auditees
- invitation admin d un utilisateur avec email, role membership, choix entre organisation existante et espace personnel, email transactionnel et lien unique vers l app web
- page publique `/setup-password` pour verifier un token d invitation, definir le mot de passe si necessaire puis rediriger vers `/login`
- gestion admin des essais, des suspensions/reactivations, des statuts d'abonnement et des roles admin avec motif obligatoire
- gestion admin du programme pilote avec `isPilotUser` et `betaAccessEnabled`
- gestion admin des idees produit avec changement de statut audite
- gestion des administrateurs avec creation de compte interne et changement de role selon le niveau autorise
- audit log admin exploitable depuis l'UI interne
- landing marketing Next.js refondue en V2 avec hero cible/promesse, bloc `Pour qui / Pas pour qui`, bloc `Probleme`, bloc `Comment Axelys aide a decider`, apercu produit contextualise, offre client pilote selective, FAQ resserree, CTA final avec vrai formulaire integre et SEO
- module simulations decision avant achat avec `/simulations` liste dossiers, `/simulations/folders/:folderId` detail dossier et comparaison, `/simulations/new` formulaire creation, `/simulations/:simulationId` detail avec resultats decisionnels, options actives, historique d'activation, journal d'opportunite, preview de conversion et conversion projet, `/simulations/:simulationId/edit` edition simulation
- preview de conversion cote web avec resume du futur projet, lots, hypotheses transferees, champs non repris, warnings et blocages metier
- bloc `Previsionnel vs reel` sur l'overview projet pour les projets issus d'une conversion avec snapshot disponible
- alertes de derive V1 sur l'overview projet converti avec statuts `neutre / a surveiller / en derive`
- bloc dashboard `Derives portefeuille` avec compteurs projets lus / en derive / a surveiller / sans reference et top 3 projets a ouvrir
- route error boundary pour eviter l'ecran technique React Router
- tests e2e API des flows critiques MVP
- smoke tests UI Playwright : login, dashboard, projet, lot, depense, document, export, settings, preview de conversion et projet converti
- workflow GitHub Actions `ci.yml` pour installation, lint et build du monorepo sur `push` et `pull_request` vers `main`
- workflow GitHub Actions `e2e-api.yml` separe pour `pnpm test:e2e:api` avec PostgreSQL de CI

## 13. Etat actuel

### 1. Direction produit actee (doctrine)

**Positionnement strategique :**
- Axelys devient un SaaS de decision ET de pilotage d'operations immobilieres
- **Promesse centrale** : arbitrer entre opportunites AVANT achat + mesurer l'ecart hypothese vs realite APRES acquisition
- Le produit couvre desormais 2 temps : decision avant achat via simulateur decisionnel simple + pilotage apres achat via projets/lots/depenses/documents

**Objectif structurant (en consolidation continue) :**
- **ZERO DOUBLE SAISIE** : objectif produit central consistant a eviter toute ressaisie manuelle complete entre simulation et projet reel
- Cet objectif guide la conception et est maintenant consolide sur le flux standard `1 simulation -> 1 projet converti`, avec snapshot previsionnel cree automatiquement

**Doctrine produit renforcee :**
- Alertes anticipatives (pas seulement descriptives)
- Friction de saisie = risque critique produit
- Score toujours contextualise et explicable
- Aucun indicateur sans impact decisionnel

**Garde-fous simulateur V1 :**
- Moins de 15 champs critiques obligatoires
- Saisie rapide utilisable apres une visite d'opportunite
- Calculs simples, comprehensibles, explicables
- Pas d'IA, pas de moteur expert, pas de cash-flow ultra detaille

### 2. Implemente (fonctionnel aujourd'hui)

**Module simulation - structure de base :**
- Entites `SimulationFolder`, `Simulation`, `SimulationLot`, `OpportunityEvent`, `SimulationConversion` et `ProjectForecastSnapshot` presentes dans le schema Prisma
- Routes API simulation-folders et simulations fonctionnelles
- Ecrans frontend `/simulations`, `/simulations/folders/:folderId`, `/simulations/new`, `/simulations/:simulationId`, `/simulations/:simulationId/edit`
- Dossiers d'opportunites : creation, edition, archivage, regroupement de simulations
- Simulations : creation, edition, archivage, affichage resultats decisionnels

**Saisie simulation :**
- Formulaire creation et edition avec moins de 15 champs obligatoires
- Disposition 2 colonnes desktop pour limiter le scroll
- Formulaire creation / edition maintenant partage via un composant unique pour eviter les divergences entre les 2 flows
- Structure de saisie refondue en 4 blocs visuels sobres : `Bien & contexte`, `Acquisition`, `Financement`, `Exploitation & securite`
- Saisie strategie (revente ou locatif), prix, frais, travaux par postes, financement
- Micro-resumes front non intrusifs dans `Acquisition` et `Financement` pour donner un feedback immediat, tout en laissant le backend source de verite pour les resultats detailes
- Montant du pret auto-calcule cote front a partir du cout d'acquisition indicatif moins l'apport, avec override manuel explicite et bouton `Recalculer`
- Preparation optionnelle de lots avec types (`APARTMENT`, `GARAGE`, `CELLAR`, `OTHER`)

**Calculs decisionnels backend :**
- Calculs centralises dans `simulation-metrics.util.ts`
- Calcul detaille des frais de notaire centralise dans `simulation-notary-fees.util.ts`
- Metriques : cout total, fonds propres, marges brute/nette, rendement, mensualite, duree, capital mobilise
- Score de fiabilite calcule
- Statut decisionnel calcule
- Recommandation calculee : `interessant` / `a negocier` / `trop risque`
- Les frais de notaire integres au plan de financement incluent : base taxable nette du mobilier, TPF / droits d'enregistrement, CSI, debours et emoluments par tranches
- Les taux departementaux sur l'ancien sont resolus via une configuration centralisee par code departement, documentee a partir de la grille DGFiP DMTO au 1er fevrier 2026
- Le statut `isFirstTimeBuyer` est desormais stocke pour preparer la logique reglementaire, mais n'entraine pas encore de modulation automatique dans le calcul

**Comparaison simulations :**
- Tableau de synthese simple pour comparer simulations d'un meme dossier
- Affichage cote a cote des metriques principales

**Journal d'opportunite :**
- Entite `OpportunityEvent` pour documenter evenements structurants (visite, negociation, changement hypothese)
- Types : `NEGOTIATION_PRICE`, `BANK_FINANCING_QUOTE`, `VISIT_NOTE`, `RISK_ALERT`, `ASSUMPTION_CHANGE`, `OTHER`
- Affichage chronologique dans le detail simulation
- **Le journal documente mais ne modifie PAS les hypotheses actives utilisees dans le calcul**

**Conversion simulation vers projet :**
- Route API `GET /api/simulations/:simulationId/conversion-preview` implementee
- Route API `POST /api/simulations/:simulationId/convert-to-project` durcie et transactionnelle
- **Regle metier retenue** : une simulation ne peut etre convertie qu'une seule fois ; toute reconversion est bloquee explicitement pour eviter les doublons silencieux
- **Semantique HTTP retenue** : `SIMULATION_ALREADY_CONVERTED` -> `409 Conflict`, `SIMULATION_ARCHIVED` et autres blocages metier -> `422 Unprocessable Entity`
- Preview de conversion avec futur projet, futurs lots, hypotheses transferees, champs non repris, warnings et blocages metier
- Reutilisation des donnees principales utiles (nom, strategie, prix, frais, travaux, financement utile, lots prepares)
- Mapping `SimulationLotType` vers `LotType` implemente pour conversion lots
- Creation systematique d'une trace `SimulationConversion` avec simulation source, projet cree, acteur, date et statut
- Creation systematique d'un snapshot `ProjectForecastSnapshot` immutable au moment de la conversion
- `SimulationConversion` sert de trace metier principale ; `Simulation.convertedProjectId` reste un raccourci maintenu pour les lectures rapides de l'UI et la compatibilite

**Suivi previsionnel vs reel :**
- L'overview projet expose maintenant un bloc `Previsionnel vs reel` pour les projets convertis avec snapshot disponible
- Endpoint `GET /api/projects/:projectId/overview` enrichi avec `forecastComparison`
- KPI V1 calcules si la source existe : cout acquisition, budget travaux, cout total recalcule, nombre de lots, loyer mensuel, rendement brut
- `acquisitionCost` est compare avec la meme definition cote snapshot et cote projet
- `totalProjectCost` et `grossYield` sont recalcules cote projet sur une base homogene : cout d'acquisition actuel + enveloppe travaux la plus prudente (`max(budget actuel, depenses travaux engagees)`) + buffer fige a la conversion
- `lotsCount` compare les lots prepares au snapshot aux lots non archives actuellement presents sur le projet
- Les KPI non calculables proprement restent `non disponibles` plutot que d'etre extrapoles artificiellement
- Les alertes de derive sont centralisees cote backend avec seuils simples et explicables
- Alertes V1 disponibles : depassement budget travaux, depassement cout total, incoherence nombre de lots, loyer inferieur au previsionnel, rendement brut degrade
- Le dashboard global expose maintenant un bloc `Derives portefeuille` alimente par `GET /api/dashboard/drifts`, qui reagrege les projets actifs sur la base du `forecastComparison` existant
- La lecture portefeuille reste volontairement simple : compteurs `en derive / a surveiller / sans reference` + top 3 projets critiques avec causes principales

**Options actives (arbitrage avec donnees terrain) :**
- Entites `SimulationOptionGroup` et `SimulationOption` implementees dans schema Prisma
- Entite `SimulationOptionActivationLog` implementees pour tracer chaque activation utilisateur
- Types d'options geres : `PURCHASE_PRICE`, `WORK_BUDGET`, `FINANCING`
- Sources d'options : `MANUAL` (saisie directe) ou `FROM_EVENT` (creee depuis journal)
- Routes API completes : `GET/POST /option-groups`, `POST /options`, `PATCH /options/:id/activate`, `DELETE /options/:id`, `GET /options/:id/impact`, `GET /options/activation-history`, `GET /options/groups/:groupId/comparison`
- Service backend `SimulationOptionsService` avec CRUD, activation, **journalisation des decisions** et **simulation d'impact**
- **Comparaison instantanee avant activation** : endpoint `/impact` retourne metriques base, metriques simulees et deltas sans modifier donnees
- Fonction `simulateWithOptionOverride` backend pour calculer impact d'une option sans activation reelle (aucune persistence, aucun side effect)
- Moteur de calcul `simulation-resolver.util.ts` adapte pour utiliser options actives (fallback sur valeurs initiales)
- Onglet "Options" dans detail simulation avec UI selection options actives (radio buttons, activation explicite) et **comparaison cote a cote durable**
- Onglet "Historique" dans detail simulation avec timeline simple des activations et deltas principaux
- **Affichage impact visuel au survol** : pour chaque option non active, affichage automatique deltas (cout, marge, mensualite, duree, score) avec couleurs (vert = amelioration, rouge = degradation)
- Badges visuels : "Actuel" pour option active, "Alternative" pour options non actives
- Creation d'option simplifiee dans le journal : type auto si evenement prix/financement sinon choix par boutons rapides `Prix / Travaux / Financement`, modal contextuel sans select technique avec max 3 champs utiles et pre-remplissage depuis la description si possible
- **Activation explicite par utilisateur** : pas de selection automatique, pas de magie, controle total
- **Calculs utilisent uniquement l'option active** : si option active existe pour un type, elle remplace la valeur initiale
- **Lien journal → options desormais fonctionnel** : creation explicite d'option depuis evenement avec sourceEventId
- Tests E2E backend pour validation multi-tenant, activation, suppression, historique et impact/comparaison (coherence deltas, aucune modification base)

**Corrections recentes :**
- Bug critique corrige : formulaire lots envoyait valeurs francaises (APPARTEMENT) au lieu d'anglaises (APARTMENT)
- Fonction `getLotTypeLabel()` pour affichage francais + envoi valeurs enum correctes
- Tests E2E backend pour valider types lots et comptage loyers
- Checkbox `primo-accedant` refaite avec meilleur alignement, meilleure lisibilite et zone cliquable correcte dans le bloc acquisition
- Test Playwright web ajoute pour verifier la structure du formulaire simulation et le cycle `pret auto -> manuel -> recalcul`

### 3. En cours de stabilisation / partiel / limites connues

**UX simulation encore perfectible :**
- Lisibilite onglet travaux a ameliorer malgre deltas calcules par poste
- Affichage hypotheses actives ameliore mais peut encore gagner en clarte
- Messages d'etat vide ameliores mais certains contextes peuvent rester confus

**Logique locative encore basique :**
- Si lots ont loyers : calcul automatique
- Sinon : loyer manuel saisi dans formulaire principal
- Source visible dans resultats mais logique encore simpliste pour strategie locative complexe

**Journal d'opportunite maintenant connecte aux calculs via options :**
- Le journal documente toujours sans modifier automatiquement les hypotheses
- Mais l'utilisateur peut desormais creer explicitement une option depuis un evenement
- L'option creee peut ensuite etre activee pour impacter les calculs
- **Pas de parsing automatique** : creation manuelle, controle explicite

**Conversion simulation -> projet V1 robuste mais volontairement simple :**
- La regle `1 simulation = 1 projet` est stricte et assumee en V1
- La preview couvre les cas courants mais ne propose pas encore de configuration fine ou de reconversion controlee
- Les donnees non utiles au pilotage apres achat restent volontairement hors transfert pour eviter de polluer le projet reel

**Arbitrage base sur options actives avec comparaison instantanee :**
- Options prix d'achat multiples maintenant possibles via `SimulationOption`
- Options financement multiples maintenant possibles via `SimulationOption`
- **Comparaison instantanee avant activation** : survol option affiche impact visuel sans activer
- **Comparaison cote a cote des options d'un meme groupe** desormais disponible dans l'onglet Options
- **Historique des activations** desormais disponible dans l'onglet Historique avec avant/apres, auteur et deltas principaux
- Deltas calcules backend sans modification donnees : cout, marge, mensualite, duree, score
- Pas encore de comparaison multi-groupes ou exportable pour partage externe
- Recommandation calculee mais criteres encore basiques

**Mesure ecart hypothese vs realite maintenant disponible en V1, avec limites assumees :**
- Les projets convertis avant l'ajout de `ProjectForecastSnapshot` n'ont pas de reference previsionnelle retroactive
- Une lecture portefeuille simple des derives existe maintenant sur le dashboard, mais reste volontairement sobre : pas de filtres avances, pas d'export et pas de BI lourde
- Certains KPI restent hors scope tant qu'aucune source fiable n'existe cote reel : capital mobilise constate, marge reelle de revente, cash-flow reel detaille
- La logique locative reste simple : loyer issu des lots si disponible, sinon fallback sur la valeur projet/simulation

### 4. Non implemente / prochaines etapes

**Arbitrage multi-scenarios avance :**
- Tableau comparatif avance multi-groupes ou exportable pour partage banque / associes
- Historique des activations enrichi si besoin avec niveau de justification supplementaire
- Export comparatif pour partage avec partenaires/banque

**Mesure ecart previsionnel vs reel :**
- Enrichir les KPI reels uniquement quand une source metier fiable existe dans le projet
- Enrichir la lecture portefeuille existante seulement si cela reste simple, fiable et utile : filtres legers, export leger ou drill-down plus direct, sans vue analytics lourde
- Eventuellement backfiller les anciens projets convertis via une action explicite et non silencieuse
- Ajouter des alertes de delai seulement si une source calendrier robuste est introduite

**Scoring contextualise :**
- Score adapte au type d'operation (achat/revente vs locatif long terme)
- Score adapte au profil investisseur (primo-accedant vs experimente)
- Score explicable avec criteres detailles

**Alertes anticipatives simulation :**
- Alerte si marge trop faible par rapport au risque identifie
- Alerte si financement tendu
- Alerte si duree projet incompatible avec strategie

**Robustesse conversion :**
- Preview plus riche si besoin avec diff visuelle par champ et resume encore plus oriente action
- Historique de conversion rendu visible dans le dossier d'opportunite si la lecture utilisateur en a besoin
- Eventuelle preview d'ecarts post-conversion plus detaillee avant creation du projet

**Etat technique actuel :**

- Le repo est scaffolded en monorepo avec `apps/landing`, `apps/web` et `apps/api`
- Le backend expose deja : auth, dashboard global, organization courante, memberships, projects, lots, expenses, documents, exports CSV
- Le backend expose deja : auth, dashboard global, organization courante, memberships, projects, lots, expenses, documents, exports CSV, boite a idees produit et acces beta pilote
- Le frontend expose deja : login, dashboard global, liste projets, creation projet, detail projet, lots, depenses, documents, export, settings et boite a idees produit
- Un back-office admin interne distinct est maintenant expose dans `apps/web` sous `/admin`, avec un layout separe et des pages dediees `dashboard / users / admins / audit-logs`
- L'API expose maintenant un domaine admin dedie sous `/api/admin/*` avec controllers/services separes de l'API produit
- La creation / invitation d utilisateurs en MVP peut maintenant se faire depuis le back-office admin, sans signup public et sans passage par la landing marketing
- Le modele `User` porte desormais un `adminRole` global, le statut de suspension, les informations d'essai, le statut/plan d'abonnement et la date de derniere connexion
- Le modele `User` porte maintenant aussi `isPilotUser` et `betaAccessEnabled` pour un programme pilote simple sans complexifier les roles existants
- Le champ `User.passwordHash` peut rester nul tant qu un utilisateur invite n a pas encore defini son mot de passe
- Les permissions admin sont verifiees cote backend sur chaque route sensible via guards et decorators dedies, l'UI ne fait qu'une adaptation d'affichage
- Les feature requests produit et leurs votes sont strictement scopes par `organizationId` pour rester coherents avec la regle multi-tenant globale du repo
- La boite a idees reste volontairement minimale : pas de commentaires, pas de pieces jointes, pas de tags complexes et pas de logique sociale
- Les votes sur les idees servent uniquement de signal de priorisation ; la decision produit reste interne et le message UX l explicite dans l application
- Le backend expose maintenant un helper d acces beta simple via `User.isPilotUser + User.betaAccessEnabled` et un guard leger reserve aux vues beta pilotes
- L app produit expose maintenant `/ideas` pour proposer et voter des idees dans l organisation courante, avec tri `plus votees / plus recentes` et filtre par statut
- Les utilisateurs pilotes avec acces beta actif voient un espace de validation beta limite aux idees `IN_PROGRESS` et un message rappelant que les fonctionnalites testees restent instables
- Le back-office admin permet maintenant de changer le statut des idees et de piloter l acces pilote/beta des utilisateurs avec audit log
- Les changements sensibles admin sont traces dans `AdminAuditLog` avec acteur, cible, motif, avant/apres et metadata de requete
- Les invitations admin sont desormais stockees dans `UserInvitation` avec token hash, expiration, invalidation et rattachement organisation / role
- `UserInvitation` porte maintenant un `organizationMode` ; `organizationId` peut rester nul uniquement tant qu une invitation `personal` n a pas encore ete acceptee
- Le backend centralise le flow d invitation dans un domaine dedie `src/invitations`, reutilise par l admin et par l auth publique
- Un module `src/mail` simple existe maintenant avec priorite SMTP, support optionnel de Resend et fallback console en local
- Le flow d invitation cree un lien unique vers `APP_WEB_URL/setup-password?token=...`, verifie le token, permet la definition du mot de passe si necessaire, active le membership cible puis redirige vers `/login`
- Une invitation admin peut maintenant viser une organisation existante ou un espace personnel ; si besoin, l organisation personnelle est creee a l acceptation pour conserver un multi-tenant strict sans tenant orphelin inutile
- Un utilisateur solo reste donc strictement multi-tenant via `1 user + 1 organization personnelle + 1 membership`
- Les garde-fous admin couvrent notamment : impossibilite de suspendre son propre compte, impossibilite de changer son propre role admin, blocage de la suppression/degradation du dernier `SUPER_ADMIN`, restrictions d'elevation pour `ADMIN` et limites de trial par role
- La landing marketing Next.js adopte maintenant un positionnement plus tranché et plus sélectif : elle parle d’abord aux investisseurs immobiliers actifs et marchands de biens qui pilotent plusieurs opérations en parallèle
- La promesse visible de la landing est désormais : piloter avec des faits plutôt qu’avec des impressions, et voir rapidement quels projets sont `OK`, `À surveiller` ou `Problématique`
- La landing V2.2 conserve cette ossature mais avec un copy encore plus court et plus orienté action
- Règle copywriting landing : une section = une information utile ; phrases courtes ; pas de storytelling inutile ; pas de répétition des mêmes promesses dans plusieurs blocs
- Règle ton landing : direct et sélectif, mais jamais condescendant ; si le produit n’est pas adapté, on le dit simplement
- Règle crédibilité landing : aucune promesse d’intégration, d’application mobile, de sécurité, de conformité ou de délai support si elle n’est pas documentable
- Règle rareté landing : pas de compteur public ni de chiffre de places restantes tant que la donnée n’est pas dynamique et réelle
- Règle typographique landing : accents français, apostrophes typographiques et statuts affichés proprement (`À surveiller`, `Problématique`, `aperçu`, `accès`, etc.)
- Principe de réduction landing V2.2 : supprimer les blocs redondants avant d’ajouter du texte ; garder le minimum nécessaire pour faire agir
- La structure retenue pour la landing V2.2 est stabilisée : hero, CTA rapide, bloc `Problème`, CTA intermédiaire, bloc `Comment ça aide`, bloc `Preuve concrète`, bloc `Offre client pilote`, FAQ courte, CTA final avec formulaire
- La preuve concrète de la landing repose maintenant sur un exemple simplifié tiré du contexte de démo du repo, pour rendre le produit tangible sans inventer un cas marketing
- La landing marketing embarque des metadata SEO, Open Graph, Twitter et du JSON-LD `SoftwareApplication` + `FAQPage`
- La landing publique ne pousse plus un comparatif de plans ; elle met en avant un programme `client pilote` sélectif à `15 EUR / mois`, avec référence publique visée à `29 EUR / mois` hors programme
- Le programme `client pilote` reste volontairement borné : pas de compteur public, sélection humaine, pas de signup automatique, et conservation du tarif pilote pour les profils retenus
- Le CTA principal de la landing mène maintenant au formulaire intégré en bas de page ; la route `/apply` expose le même formulaire dans une page dédiée
- Le CTA final affiche maintenant explicitement `Réponse sous 24–48 h`, `Accès progressif` et `Aucun engagement` au-dessus du formulaire
- Le formulaire de la landing collecte `firstname`, `email`, `profileType`, `projectCount`, `problemDescription` et l’acceptation du cadre pilote, puis relaie vers `POST /api/pilot-applications` via la route Next.js `apps/landing/app/api/pilot-applications/route.ts`
- Le choix cible pour les paiements futurs est Revolut, documente sans implementation a ce stade
- Le dashboard global est la page d'entree post-login et synthetise le portefeuille avec agregats fiables, alertes utiles, projets a surveiller et activite recente
- Le dashboard global s'appuie sur un endpoint backend dedie et sur une base de calcul KPI partagee avec l'overview projet pour eviter la duplication de logique
- Un endpoint dedie `GET /api/dashboard/drifts` agrege maintenant les derives portefeuille en reexploitant `forecastComparison`, sans logique metier parallele
- Le backend centralise desormais, pour chaque projet, les KPI, le score de completude / fiabilite, les donnees manquantes, les alertes metier hierarchisees, les suggestions d'action et le statut decisionnel
- Le score de completude / fiabilite projet repose uniquement sur les donnees MVP presentes : prix achat, frais d'acquisition, budget travaux, lots, surfaces, loyers estimes, depenses et documents
- Le statut decisionnel projet suit une logique simple et explicable : `OK` sans alerte critique ni warning, `A surveiller` si completude moyenne ou alertes warning, `Problematique` en presence d'alerte critique ou de completude tres faible
- L'overview projet est desormais oriente decision avec un resume de pilotage, des alertes triees par gravite, des suggestions d'action et un bloc explicite des donnees manquantes
- Les projets a surveiller du dashboard global sont maintenant tries d'abord par alertes critiques, puis par completude la plus faible, puis par mise a jour recente
- Le dashboard global ajoute une comparaison simple entre projets actifs et des actions prioritaires pour les projets critiques
- Le dashboard global ajoute maintenant un bloc `Derives portefeuille` avec compteurs derives/watch/sans reference et les 3 projets convertis les plus critiques a ouvrir en priorite
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
- Migration Prisma `user_invitations_admin_flow` : ajoutee
- Migration Prisma `personal_invitation_spaces` : ajoutee
- Migration Prisma `robust_conversion_forecast_v1` : ajoutee
- Seed local de demonstration produit : OK
- Une commande unique `pnpm db:demo-seed` reset les donnees metier sans drop schema, purge les uploads seedes puis recree un dataset de demonstration commerciale
- Le seed principal est concentre sur `Noroit Invest` (`noroit-invest`) avec 6 projets contrastes, 2 tenants secondaires minimaux, des simulations structurees, des options actives, des logs d'activation et des projets convertis avec snapshots pour alimenter les derives portefeuille
- Trois comptes seed locaux sont disponibles pour les tests et la demo : `admin@example.com` / `admin123` en `SUPER_ADMIN`, `user@example.com` / `user123` en collaborateur standard et `reader@example.com` / `reader123` en lecture seule
- Le seed local ajoute aussi deux idees de demonstration dans `Noroit Invest` et marque `admin@example.com` comme utilisateur pilote avec acces beta pour faciliter les verifications manuelles
- Les URLs publiques de reference sont maintenant `https://axelys.app` pour la landing, `https://app.axelys.app` pour l'application produit et `https://api.axelys.app` pour l'API.
- Le front Vite de production doit pointer vers `https://api.axelys.app/api` via `VITE_API_URL`
- L'API Vercel avec Prisma Postgres doit utiliser une `DATABASE_URL` poolée pour le runtime et une `DIRECT_URL` directe pour Prisma CLI, Prisma Studio et les migrations
- Le deploiement Vercel de l'API passe desormais par la Function `apps/api/api/[[...route]].ts` ; `src/main.ts` reste reserve au run local Nest classique
- Le projet Vercel de l'API doit utiliser `apps/api` comme `Root Directory`, laisser l'`Output Directory` vide et executer `vercel-build` pour `prisma generate`
- Le `PrismaService` backend n'ouvre plus de connexion explicite au bootstrap afin d'eviter des connexions inutiles sur des requetes serverless qui ne touchent pas la base
- Des fichiers helper versionnes existent maintenant dans `apps/landing/.env.example`, `apps/api/.env.example` et `apps/web/.env.prod.example` pour guider le remplissage des variables de deploiement
- Les variables backend utiles au flow d invitation et aux liens externes sont maintenant `APP_WEB_URL`, `ALLOWED_ORIGINS`, `USER_INVITATION_TTL_HOURS`, `MAIL_FROM`, `PILOT_NOTIFICATION_EMAIL`, les variables `SMTP_*` pour un SMTP simple et, en option, `RESEND_API_KEY`
- Les variables landing utiles aux URLs publiques sont `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` et `API_URL`
- Le `MAIL_FROM` de reference est `Axelys <no-reply@axelys.app>` et les emails transactionnels ne doivent plus exposer d ancienne marque ou d ancien domaine
- Les comptes seed demo restent strictement reserves au local et aux tests ; la production ne doit pas embarquer de donnees de demonstration
- Tests e2e API : OK
- Smoke tests UI Playwright : en place
- Couverture Playwright actuelle : login, dashboard global, bloc `Derives portefeuille`, navigation dashboard vers projet, comparaison projets, statut decisionnel, suggestions d'action, empty state projets, creation projet, empty states d'un projet neuf, edition / archivage projet, creation lot, edition / archivage lot, creation depense avec justificatif, edition depense, verification du score de completude / fiabilite et des alertes dans l'overview, export CSV, verification document lie, upload document manuel, settings / ajout membre, invitation admin utilisateur vers organisation existante, invitation admin vers espace personnel, cas sans organisation disponible, page `setup-password`, preview de conversion simulation, affichage du bloc `Previsionnel vs reel` sur projet converti, cas `forecastComparison.available = false` et rendu propre quand `deltaPercent = null`
- Validation rejouee pendant cette session : `pnpm db:demo-seed`, `pnpm lint`, `pnpm build`, verification manuelle des endpoints `POST /api/auth/login`, `GET /api/dashboard`, `GET /api/dashboard/drifts`, `GET /api/simulation-folders`, `GET /api/simulations/folders/folder-yield-lille/comparison`, `GET /api/simulations/simulation-tourcoing-division/options/activation-history`, puis `pnpm --dir apps/web test:e2e -- tests/e2e/auth-and-projects.spec.ts tests/e2e/invitations.spec.ts tests/e2e/ideas.spec.ts` et `pnpm --dir apps/web test:e2e -- tests/e2e/project-operations.spec.ts -g "admin can view settings and add a member|activating an option refreshes the simulation overview" tests/e2e/simulations.spec.ts` = OK
- Le setup e2e backend aligne maintenant `DIRECT_URL` sur la base e2e pour eviter des resets ou migrations pointant vers une autre base que `DATABASE_URL_E2E`
- Les documents de cadrage vivent dans `docs/`

## 14. Demarrage local de reference

- Lancer la landing : `pnpm dev:landing`
- Copier `apps/api/.env.example` vers `apps/api/.env`
- Adapter `DATABASE_URL` si le PostgreSQL local n'utilise pas l'utilisateur `postgres`
- Lancer la migration puis `pnpm db:demo-seed` depuis la racine
- Login demo seed admin : `admin@example.com` / `admin123`
- Login demo seed utilisateur : `user@example.com` / `user123`
- Login demo seed lecture seule : `reader@example.com` / `reader123`
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
