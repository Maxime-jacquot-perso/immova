# MVP lancement strict - SaaS de pilotage immobilier

## 1. MVP visible strict

Le MVP visible doit tenir sur un seul axe : suivre un projet immobilier, ses lots, ses depenses et ses documents, avec quelques KPI fiables.

Fonctionnalites visibles au lancement :

- authentification
- selection de l'organisation courante
- gestion simple des membres et roles
- liste des projets
- creation / edition d'un projet
- detail projet
- liste et creation des lots dans un projet
- liste et creation des depenses / factures dans un projet
- upload et consultation de documents lies a un projet ou une depense
- dashboard projet avec KPI simples
- export CSV des depenses d'un projet

Ce qui n'est pas visible meme si la base peut etre prete :

- pas de fiche locataire
- pas d'occupation detaillee
- pas de timeline riche
- pas de simulation multi-scenarios
- pas de reporting portefeuille avance

## 2. Hors MVP

Tout ce qui suit est coupe du lancement :

- generation de baux
- signature electronique
- OCR avance
- rapprochement bancaire
- comptabilite generale
- permissions fines
- workflow de validation
- gestion locative avancee
- relances de loyers
- tenant expose dans l'UI
- occupancy detaillee
- timeline lot
- timeline projet riche
- simulation multi-scenarios complexe
- cash-flow reel
- reporting portefeuille riche
- alertes automatiques
- automatisations avancees
- imports complexes
- ventilation multi-lots en UI
- historique de revision des loyers
- CRM prestataires

Regle de coupe :

- si une fonctionnalite ne sert pas directement a enregistrer un projet, un lot, une depense, un document ou a lire un KPI fiable, elle sort.

## 3. Modele de donnees V1

### Entites obligatoires des la V1

#### Organization

- obligatoire pour le multi-tenant B2B
- supporte le cloisonnement des donnees

#### User

- obligatoire pour l'authentification

#### Membership

- obligatoire pour rattacher un utilisateur a une organisation et porter le role
- roles V1 : `admin`, `manager`, `accountant`, `reader`

#### Project

- entite coeur
- porte l'adresse, le type, le statut, les montants d'acquisition, le budget travaux, les notes

#### Lot

- entite coeur
- un lot appartient a un projet
- utile pour suivre la granularite de rentabilite et d'exploitation plus tard
- V1 visible : informations de base uniquement

#### Expense

- entite coeur
- toute depense appartient a un projet
- peut pointer directement vers un lot en V1 pour rester simple

#### Document

- obligatoire pour stocker les pieces
- rattachement a un projet et optionnellement a une depense
- le lien direct au lot peut attendre

### Entites preparees en base mais non exposees en UI MVP

- aucune n'est obligatoire
- la V1 gagne plus a rester simple qu'a sur-preparer des tables futures

### Entites a repousser completement

#### Vendor

- inutile comme table dediee au lancement
- un simple champ `vendorName` sur `Expense` suffit

#### ExpenseAllocation

- premature
- la ventilation multi-lots n'apporte rien a la vente initiale
- un `lotId` nullable sur `Expense` suffit pour la V1

#### Tenant

- inutile pour lancer
- vous ouvrez un chantier gestion locative trop tot

#### Occupancy

- inutile pour lancer
- les donnees seront pauvres, donc les KPI seront faux

#### TimelineEvent

- repousse
- apporte du bruit produit avant d'apporter de la valeur

#### ProjectScenario

- repousse si vous voulez lancer vite
- une simulation simple peut vivre en calcul transient sans entite persistante au debut

Justification produit :

- le modele V1 doit servir le pilotage financier et documentaire
- tout ce qui ouvre un sous-produit complet est coupe

## 4. KPI V1

### KPI a afficher

#### Cout acquisition

Formule :

- `purchasePrice + notaryFees + acquisitionFees`

Condition :

- affiche seulement si les champs existent

#### Budget travaux

Logique :

- valeur saisie sur le projet

#### Depenses travaux engagees

Formule :

- somme `amountTtc` des depenses categorie travaux du projet

#### Depenses totales

Formule :

- somme `amountTtc` de toutes les depenses du projet

#### Ecart budget travaux

Formule :

- `worksBudget - depensesTravaux`

Condition :

- affiche seulement si `worksBudget` est renseigne

#### Nombre de lots

Formule :

- count des lots du projet

#### Surface totale

Formule :

- somme des surfaces de lots renseignees

#### Loyer mensuel estime total

Formule :

- somme des `estimatedRent` des lots

Condition :

- n'afficher que si au moins un lot a une valeur

#### Rendement brut estime

Formule :

- `(loyerAnnuelEstime / coutAcquisitionEtTravaux) * 100`

avec :

- `loyerAnnuelEstime = somme(estimatedRent) * 12`
- `coutAcquisitionEtTravaux = cout acquisition + depenses totales`

Condition :

- affiche seulement si les montants sources sont suffisants

### KPI a ne pas afficher au lancement

- rendement net
- cash-flow reel
- cash-flow net
- vacance
- taux d'occupation
- retards locatifs
- impayes
- TRI
- comparaison portefeuille

Motif :

- pas de source fiable ou pas de valeur suffisante pour justifier la complexite

## 5. Ecrans MVP

### Navigation cible

- `Login`
- `Projects`
- `Project detail`
- `Settings`

Pas plus.

### Ecrans

#### 1. Login

- email
- mot de passe

#### 2. Projects list

- liste des projets
- recherche simple
- filtre statut
- CTA creation projet

#### 3. Create / edit project

- formulaire projet

#### 4. Project detail

Sous-vues strictes :

- `Overview`
- `Lots`
- `Expenses`
- `Documents`
- `Export`

#### 5. Project overview

- resume du projet
- KPI
- derniers documents
- dernieres depenses

#### 6. Lots

- table des lots
- creation / edition lot en drawer ou page simple

#### 7. Expenses

- table des depenses
- filtres simples
- creation / edition depense
- piece jointe eventuelle

#### 8. Documents

- liste des documents
- upload
- filtre type

#### 9. Export

- export CSV des depenses du projet

#### 10. Settings

- organisation courante
- membres
- roles simples

Coupe stricte :

- pas de menu locataires
- pas de menu prestataires dedie au lancement
- pas de dashboard portefeuille separe
- pas de timeline en navigation

## 6. Architecture backend V1

### Modules necessaires au lancement

- `auth`
- `users`
- `organizations`
- `memberships`
- `projects`
- `lots`
- `expenses`
- `documents`
- `exports`
- `prisma`
- `common`
- `storage`

### Modules a differer

- `vendors`
- `timeline`
- `tenants`
- `occupancies`
- `simulations`
- `reporting` riche
- `notifications`
- `audit` detaille

### Regles multi-tenant non negociables

- toutes les tables metier portent `organizationId`
- aucun endpoint n'accepte un `organizationId` libre depuis le body
- le `organizationId` vient du contexte auth
- toutes les requetes Prisma filtrent par `organizationId`
- tous les tests critiques couvrent les acces inter-organisations
- les documents stockent aussi `organizationId`

### Regles API V1

- CRUD simple
- pagination basique
- filtres simples
- pas de logique metier cachee complexe
- calcul KPI cote backend
- upload de fichier via abstraction `storage`

## 7. Architecture frontend V1

### Stack

- React
- Vite
- TypeScript
- React Router
- TanStack Query
- React Hook Form
- Zod

### Routing

- `/login`
- `/projects`
- `/projects/new`
- `/projects/:projectId`
- `/projects/:projectId/lots`
- `/projects/:projectId/expenses`
- `/projects/:projectId/documents`
- `/projects/:projectId/export`
- `/settings`

### Regles frontend

- un seul layout authentifie
- le detail projet est le centre de l'app
- pas d'etat global complexe si TanStack Query suffit
- pas de duplication des calculs KPI cote front
- formulaires schema-first avec Zod

### Structure de dossiers simple

```text
apps/web/src/
  app/
    router/
    providers/
    layout/
  modules/
    auth/
    projects/
    lots/
    expenses/
    documents/
    settings/
  shared/
    api/
    ui/
    forms/
    lib/
    types/
```

### Regle de simplicite

- si une fonctionnalite ne merite pas son propre module visible au lancement, elle reste absorbee dans `projects`

## 8. Plan d'execution

### Phase 1 - socle

- initialiser monorepo ou workspace simple
- config Postgres, Prisma, NestJS, React
- auth
- organisation courante
- membership et roles simples

Dependance :

- prerequis pour tout le reste

### Phase 2 - projets

- schema `Project`
- API projets
- liste projets
- creation / edition projet
- detail projet vide

Dependance :

- necessite phase 1

### Phase 3 - lots

- schema `Lot`
- API lots
- sous-vue lots du projet
- formulaire lot

Dependance :

- necessite projets

### Phase 4 - depenses

- schema `Expense`
- API depenses
- table depenses
- formulaire depense
- calculs KPI projet

Dependance :

- necessite projets
- lots facultatifs mais utiles

### Phase 5 - documents

- schema `Document`
- abstraction storage
- upload
- liste documents
- lien document/projet/depense

Dependance :

- necessite projets
- depenses utiles pour la piece jointe facture

### Phase 6 - export et finition

- export CSV
- settings membres
- durcissement multi-tenant
- tests e2e critiques

Dependance :

- necessite blocs coeur stables

### Ordre de priorite absolue

1. auth + multi-tenant
2. projets
3. lots
4. depenses
5. documents
6. KPI projet
7. export CSV

Si le temps manque, couper avant tout :

- settings membres avances
- champ prestataire structure
- filtres trop nombreux
- enrichissements UI

Ne jamais couper :

- qualite du cloisonnement multi-tenant
- qualite du CRUD projet / lot / depense
- fiabilite des KPI affiches
