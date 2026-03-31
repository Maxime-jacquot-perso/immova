# Cadrage produit et architecture - SaaS de pilotage immobilier

## 1. Positionnement produit

Le produit n'est pas un logiciel de gestion locative generaliste.
Le coeur du produit est :

- projet immobilier
- lots
- couts et depenses
- documents
- rentabilite
- pilotage portefeuille

Le produit doit repondre a 4 questions metier :

1. Combien ce projet coute vraiment ?
2. Combien rapporte chaque lot ?
3. Est-ce rentable selon des hypotheses explicites ?
4. Ou sont les alertes de pilotage : retard, vacance, depassement, budget, occupation ?

## 2. Principes produit a tenir

- Un projet peut exister sans lot au depart.
- Un lot appartient toujours a un seul projet.
- Toute depense doit appartenir a un projet, meme si elle est ensuite affectee a un lot.
- Les KPI n'existent que si la donnee source existe et si la formule est explicite.
- La gestion locative doit rester legere en V1 : occupation, loyer, charges, depot, alertes simples.
- Les documents sont stockes avec metadonnees, pas transformes en GED complexe.
- Le produit reste un SaaS de pilotage, pas un ERP travaux, pas une compta complete, pas un CRM complet.

## 3. MVP strict

### Ce qui entre dans le MVP

#### A. Socle SaaS B2B multi-tenant

- organisations
- utilisateurs
- memberships par organisation
- roles : super_admin, admin, manager, accountant, reader
- cloisonnement strict par `organizationId`

#### B. Gestion des projets

- creation / edition / archivage logique
- donnees : nom, reference interne, adresse, type, statut, prix achat, frais notaire, frais annexes, budget travaux, notes
- vue detail projet
- liste projets avec filtres par statut

#### C. Gestion des lots

- creation / edition / archivage logique
- rattachement a un projet
- donnees : nom/reference, type, surface, statut, loyer estime, loyer reel, charges, notes
- vue lots d'un projet

#### D. Depenses / factures

- creation d'une depense rattachee a un projet
- affectation simple au niveau projet ou a un lot
- donnees : numero, date, montant HT, TVA, TTC, categorie, prestataire, statut paiement, commentaire, piece jointe
- filtres par projet, lot, categorie, periode, statut de paiement
- total depense projet, total depense lot, budget travaux prevu vs reel

#### E. Prestataires

- fiche simple prestataire
- type : artisan, architecte, notaire, agence, comptable, autre
- coordonnees de base
- projets lies
- historique des depenses associees

#### F. Documents

- upload de documents
- rattachement projet et/ou lot et/ou depense
- types : facture, devis, bail, diagnostic, contrat, photo, plan, assurance, autre
- metadonnees, tags simples, recherche sur nom/type/reference

#### G. Timeline / suivi

- evenements dates par projet
- type, statut, responsable libre, date prevue, date reelle, commentaire
- notion simple de retard
- exemples : compromis signe, acte authentique, debut travaux, fin travaux, mise en location

#### H. Gestion locative legere

- fiche locataire simple
- historique d'occupation par lot
- date entree, date sortie, loyer, charges, depot de garantie, statut occupation
- indicateur simple de retard / impaye manuel

#### I. KPI utiles

- cout acquisition
- cout travaux
- cout total projet
- budget travaux prevu vs reel
- nombre de lots
- lots occupes / vacants
- taux d'occupation
- rendement brut estime
- rendement net estime
- vacance simple

#### J. Simulation simple

- scenarios prudent / realiste / optimiste
- variables : prix achat, frais, travaux, loyers, charges, taxe fonciere, vacance, financement
- sorties : rendement brut, rendement net, mensualite estimee, cash-flow estime

#### K. Export

- export CSV des depenses
- filtres : projet, lot, categorie, periode, statut
- format propre pour comptable

### Ce qui ne doit pas entrer dans le MVP

- generation de baux
- signature electronique
- OCR avance des factures
- rapprochement bancaire
- comptabilite generale
- workflow de validation complexe
- automatisations multi-etapes
- gestion technique travaux tres fine
- marketplace prestataires
- CRM commercial
- application mobile specifique

## 4. V2 pertinente

- ventilation multi-lots des depenses avec cles d'affectation
- export ZIP des pieces justificatives
- templates documentaires
- relances de paiement basiques
- alertes automatiques budget / retard / vacance
- tableaux de bord portefeuille plus pousses
- historique de variation des loyers et charges
- permissions plus fines par equipe ou portefeuille
- imports CSV de donnees
- OCR assiste si vrai gain de temps

## 5. Ce qu'il faut challenger

### 1. "Cash-flow reel"

Sans saisie reguliere fiable des encaissements, charges et financement, le cash-flow reel sera faux ou trompeur.
En V1, mieux vaut :

- cash-flow estime dans la simulation
- cash-flow "observe" uniquement si les donnees necessaires sont saisies

### 2. "Retards locatifs"

Sans vrai ledger mensuel des loyers, un retard est une information manuelle.
En V1, l'indicateur doit etre simple et assume :

- statut paiement manuel
- montant d'impaye optionnel

### 3. "Rendement net"

Le rendement net depend de conventions de calcul.
Il faut afficher la formule retenue dans l'UI et l'appliquer partout de la meme facon.

### 4. "Prestataires"

Ne pas construire un CRM.
Une fiche contact enrichie + historique de depenses suffit en V1.

### 5. "Documents"

Ne pas construire une GED complete.
Stockage, metadonnees, lien aux entites, recherche simple : suffisant pour demarrer.

## 6. Modele de donnees initial

### Entites coeur

- Organization
- User
- Membership
- Project
- Lot
- Vendor
- Expense
- ExpenseAllocation
- Document
- TimelineEvent
- Tenant
- Occupancy
- ProjectScenario

### Relations structurantes

- une `Organization` possede plusieurs `Projects`, `Vendors`, `Documents`, `Users` via `Membership`
- un `Project` possede plusieurs `Lots`, `Expenses`, `Documents`, `TimelineEvents`, `ProjectScenarios`
- un `Lot` appartient a un `Project`
- une `Expense` appartient a un `Project` et peut etre affectee au projet ou a un lot via `ExpenseAllocation`
- un `Document` peut etre lie a un projet, un lot, une depense
- un `Tenant` peut avoir plusieurs `Occupancies`
- une `Occupancy` appartient a un lot

### Decision cle de modelisation

Pour preparer la ventilation future sans complexifier l'UI :

- l'UI MVP cree une seule allocation par depense
- le modele introduit deja `ExpenseAllocation`

Ainsi, vous evitez une migration douloureuse plus tard.

## 7. Entites Prisma principales

```prisma
model Organization {
  id           String       @id @default(cuid())
  name         String
  slug         String       @unique
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  memberships  Membership[]
  projects     Project[]
  vendors      Vendor[]
  documents    Document[]
  tenants      Tenant[]
}

model User {
  id           String       @id @default(cuid())
  email        String       @unique
  firstName    String?
  lastName     String?
  passwordHash String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  memberships  Membership[]
}

model Membership {
  id             String    @id @default(cuid())
  organizationId String
  userId         String
  role           Role
  createdAt      DateTime  @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
}

model Project {
  id                String           @id @default(cuid())
  organizationId    String
  name              String
  reference         String?
  addressLine1      String?
  postalCode        String?
  city              String?
  country           String?          @default("FR")
  type              ProjectType
  status            ProjectStatus
  purchasePrice     Decimal?         @db.Decimal(12, 2)
  notaryFees        Decimal?         @db.Decimal(12, 2)
  acquisitionFees   Decimal?         @db.Decimal(12, 2)
  worksBudget       Decimal?         @db.Decimal(12, 2)
  notes             String?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  organization      Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  lots              Lot[]
  expenses          Expense[]
  documents         Document[]
  timelineEvents    TimelineEvent[]
  scenarios         ProjectScenario[]

  @@index([organizationId, status])
}

model Lot {
  id                String       @id @default(cuid())
  organizationId    String
  projectId         String
  name              String
  reference         String?
  type              LotType
  status            LotStatus
  surface           Decimal?     @db.Decimal(10, 2)
  estimatedRent     Decimal?     @db.Decimal(10, 2)
  actualRent        Decimal?     @db.Decimal(10, 2)
  monthlyCharges    Decimal?     @db.Decimal(10, 2)
  notes             String?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  project           Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  occupancies       Occupancy[]
  expenseAllocs     ExpenseAllocation[]
  documents         Document[]

  @@index([organizationId, projectId, status])
}

model Vendor {
  id                String       @id @default(cuid())
  organizationId    String
  name              String
  type              VendorType
  email             String?
  phone             String?
  companyName       String?
  notes             String?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  expenses          Expense[]

  @@index([organizationId, type])
}

model Expense {
  id                String            @id @default(cuid())
  organizationId    String
  projectId         String
  vendorId          String?
  invoiceNumber     String?
  issueDate         DateTime
  dueDate           DateTime?
  paidDate          DateTime?
  amountHt          Decimal           @db.Decimal(12, 2)
  vatAmount         Decimal           @db.Decimal(12, 2)
  amountTtc         Decimal           @db.Decimal(12, 2)
  category          ExpenseCategory
  paymentStatus     PaymentStatus
  comment           String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  project           Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  vendor            Vendor?           @relation(fields: [vendorId], references: [id], onDelete: SetNull)
  allocations       ExpenseAllocation[]
  documents         Document[]

  @@index([organizationId, projectId, category, paymentStatus])
}

model ExpenseAllocation {
  id                String            @id @default(cuid())
  expenseId         String
  targetType        AllocationTargetType
  lotId             String?
  sharePercent      Decimal?          @db.Decimal(5, 2)
  amountTtc         Decimal?          @db.Decimal(12, 2)

  expense           Expense           @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  lot               Lot?              @relation(fields: [lotId], references: [id], onDelete: SetNull)

  @@index([expenseId, targetType])
}

model Document {
  id                String         @id @default(cuid())
  organizationId    String
  projectId         String?
  lotId             String?
  expenseId         String?
  type              DocumentType
  title             String
  originalFileName  String
  storageKey        String         @unique
  mimeType          String
  sizeBytes         Int
  uploadedAt        DateTime       @default(now())

  organization      Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  project           Project?       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  lot               Lot?           @relation(fields: [lotId], references: [id], onDelete: Cascade)
  expense           Expense?       @relation(fields: [expenseId], references: [id], onDelete: Cascade)

  @@index([organizationId, type])
  @@index([projectId, lotId, expenseId])
}

model TimelineEvent {
  id                String            @id @default(cuid())
  organizationId    String
  projectId         String
  lotId             String?
  type              TimelineEventType
  title             String
  status            TimelineStatus
  ownerLabel        String?
  plannedDate       DateTime?
  actualDate        DateTime?
  notes             String?
  createdAt         DateTime          @default(now())

  project           Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  lot               Lot?              @relation(fields: [lotId], references: [id], onDelete: SetNull)

  @@index([organizationId, projectId, status])
}

model Tenant {
  id                String         @id @default(cuid())
  organizationId    String
  firstName         String
  lastName          String
  email             String?
  phone             String?
  notes             String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  organization      Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  occupancies       Occupancy[]
}

model Occupancy {
  id                String            @id @default(cuid())
  organizationId    String
  lotId             String
  tenantId          String
  status            OccupancyStatus
  entryDate         DateTime
  exitDate          DateTime?
  rentAmount        Decimal           @db.Decimal(10, 2)
  chargesAmount     Decimal?          @db.Decimal(10, 2)
  securityDeposit   Decimal?          @db.Decimal(10, 2)
  paymentStatus     RentPaymentStatus @default(UNKNOWN)
  arrearsAmount     Decimal?          @db.Decimal(10, 2)
  notes             String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  lot               Lot               @relation(fields: [lotId], references: [id], onDelete: Cascade)
  tenant            Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([organizationId, lotId, status])
}

model ProjectScenario {
  id                    String       @id @default(cuid())
  organizationId        String
  projectId             String
  name                  String
  scenarioType          ScenarioType
  purchasePrice         Decimal?     @db.Decimal(12, 2)
  acquisitionFees       Decimal?     @db.Decimal(12, 2)
  worksAmount           Decimal?     @db.Decimal(12, 2)
  monthlyRentTotal      Decimal?     @db.Decimal(12, 2)
  monthlyChargesTotal   Decimal?     @db.Decimal(12, 2)
  annualPropertyTax     Decimal?     @db.Decimal(12, 2)
  vacancyRatePercent    Decimal?     @db.Decimal(5, 2)
  loanAmount            Decimal?     @db.Decimal(12, 2)
  loanRatePercent       Decimal?     @db.Decimal(5, 2)
  loanDurationMonths    Int?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  project               Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([organizationId, projectId, scenarioType])
}
```

### Enums minimales

- `Role`
- `ProjectType`
- `ProjectStatus`
- `LotType`
- `LotStatus`
- `VendorType`
- `ExpenseCategory`
- `PaymentStatus`
- `AllocationTargetType`
- `DocumentType`
- `TimelineEventType`
- `TimelineStatus`
- `OccupancyStatus`
- `RentPaymentStatus`
- `ScenarioType`

## 8. Architecture backend NestJS

### Principe

Faire un monolithe modulaire propre.
Pas de microservices en V1.
Pas de CQRS lourd en V1.
Pas d'event bus distribue au demarrage.

### Modules

- `auth`
- `organizations`
- `users`
- `memberships`
- `projects`
- `lots`
- `vendors`
- `expenses`
- `documents`
- `timeline`
- `tenants`
- `occupancies`
- `simulations`
- `reporting`
- `exports`
- `storage`
- `common`
- `prisma`

### Responsabilites clefs

- `auth` : login, refresh, invitation plus tard
- `organizations` : contexte tenant courant
- `projects` : CRUD projet, dashboard projet
- `lots` : CRUD lot, statut, loyer
- `expenses` : CRUD depenses, allocations, totaux
- `documents` : metadata, upload, signed URLs
- `timeline` : CRUD evenements
- `occupancies` : historique occupation, locataire courant
- `simulations` : calculs de rendement / cash-flow estime
- `reporting` : KPI projet, KPI portefeuille
- `exports` : generation CSV
- `storage` : abstraction S3-compatible

### Patterns a imposer

- tous les endpoints recuperent le `organizationId` depuis le contexte authentifie
- aucune requete Prisma business sans filtre tenant
- DTO valides cote API
- services applicatifs simples
- logique de calcul KPI centralisee dans un dossier `domain` ou `services/calculations`
- transactions Prisma pour creations complexes

### Multi-tenant recommande

Pour la V1 :

- base partagee
- schema partage
- `organizationId` sur toutes les tables metier
- guards applicatifs + tests de non-regression tenant

Option a etudier ensuite :

- RLS Postgres si l'equipe maitrise bien

## 9. Architecture frontend React + Vite

### Ligne directrice

Application dashboard, orientee flux de travail.
Architecture par domaines fonctionnels, pas par type technique.

### Librairies raisonnables

- React Router
- TanStack Query
- React Hook Form
- Zod
- table library simple
- composant upload simple

### Ecrans MVP

- login
- selection / contexte organisation
- dashboard portefeuille
- liste projets
- detail projet
- onglet lots
- onglet depenses
- onglet documents
- onglet timeline
- onglet simulation
- annuaire prestataires
- export depenses
- parametres organisation / utilisateurs

### Principes UX

- une fiche projet devient le centre de gravite
- les lots vivent surtout dans le detail projet, pas dans une navigation separee trop lourde
- les KPI doivent etre visibles mais expliquables
- chaque chiffre important doit pouvoir etre retrace a ses donnees sources
- privilegier filtres simples et vues lisibles

## 10. Structure de dossiers recommandee

### Frontend

```text
apps/web/
  src/
    app/
      router/
      providers/
      layout/
    modules/
      auth/
      organizations/
      dashboard/
      projects/
        components/
        pages/
        hooks/
        api/
        schemas/
      lots/
      expenses/
      vendors/
      documents/
      timeline/
      occupancies/
      simulations/
      reporting/
      settings/
    shared/
      ui/
      forms/
      table/
      layout/
      lib/
      api/
      utils/
      config/
      types/
```

### Backend

```text
apps/api/
  src/
    main.ts
    app.module.ts
    common/
      guards/
      decorators/
      filters/
      interceptors/
      pipes/
      constants/
    prisma/
      prisma.module.ts
      prisma.service.ts
    auth/
    organizations/
    users/
    memberships/
    projects/
      dto/
      controllers/
      services/
      domain/
    lots/
    vendors/
    expenses/
      dto/
      services/
      domain/
    documents/
    timeline/
    tenants/
    occupancies/
    simulations/
      domain/
    reporting/
      domain/
    exports/
    storage/
  prisma/
    schema.prisma
    migrations/
```

## 11. Pieges produit

- vouloir faire une gestion locative complete trop tot
- melanger simulation pre-acquisition et exploitation reelle sans distinguer les hypotheses
- calculer des KPI "marketing" sans source fiable
- multiplier les statuts inutiles
- faire des fiches prestataires trop riches
- ajouter des automatisations avant d'avoir un flux manuel propre
- laisser les documents sans taxonomie minimale
- oublier les cas "projet sans lot" et "lot non encore loue"

## 12. Pieges techniques

- oublier `organizationId` sur certaines tables annexes
- appliquer le filtrage tenant dans les controllers mais pas dans les services
- stocker les fichiers en base au lieu de stocker seulement les metadonnees
- disperser les calculs de KPI entre frontend, SQL et backend
- utiliser des enums trop fines au depart
- introduire une architecture microservices ou event-driven trop tot
- vouloir faire de l'Excel formate en V1 alors qu'un CSV robuste suffit

## 13. Feuille de route realiste

### Phase 0 - cadrage

- figer le vocabulaire metier
- figer les KPI V1 et leurs formules
- figer les statuts V1
- figer les roles V1

### Phase 1 - socle SaaS

- auth
- organisations
- roles
- layout app
- navigation
- base Prisma / Postgres

### Phase 2 - coeur metier

- projets
- lots
- depenses
- prestataires
- dashboard projet simple

### Phase 3 - documents et timeline

- upload
- indexation metadata
- timeline projet

### Phase 4 - occupation et rentabilite

- locataires
- occupation
- simulation
- KPI portefeuille

### Phase 5 - export et finition

- export CSV
- permissions
- durcissement multi-tenant
- tests e2e critiques

## 14. Recommandations finales

Si vous voulez une V1 vraiment utile, tenez la ligne suivante :

- centre de gravite = fiche projet
- les lots servent a expliquer le projet
- les depenses servent a expliquer les couts
- les documents servent a justifier les actions
- les KPI servent a decider, pas a decorer

La meilleure V1 n'est pas celle qui couvre tout.
C'est celle qui donne une vision fiable du cout reel, de l'etat du projet et de la rentabilite probable.
