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
- **objectif zero double saisie** : reutilisation des donnees de simulation lors de la creation du projet reel, desormais consolidee sur le flux standard de conversion

**Pilotage apres achat :**
- projets convertis depuis simulation ou crees directement
- lots herites de la simulation ou crees apres achat
- depenses / factures
- documents
- KPI projet simples et fiables
- lecture portefeuille simple des derives sur le dashboard pour savoir quels projets demandent une action rapide
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
- **preview de conversion** avant creation du projet, avec resume des donnees transferees, lots futurs, champs non repris, warnings et blocages metier
- **conversion robuste** regie par une regle simple : `1 simulation = 1 projet cree`
- **tracabilite de conversion** via `SimulationConversion` avec simulation source, projet cree, acteur, date et statut
- **snapshot previsionnel immutable** via `ProjectForecastSnapshot` cree au moment de la conversion pour figer les hypotheses de reference
- **tableau de bord projet "Previsionnel vs reel"** sur les projets convertis, calcule cote backend
- **alertes de derive V1** simples et explicables sur budget travaux, cout total, comptage de lots, loyer et rendement quand la donnee existe
- **lecture portefeuille des derives sur le dashboard** : compteur des projets en derive / a surveiller / sans reference previsionnelle et top 3 projets a ouvrir en priorite
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
- comparaison encore simple : un seul groupe a la fois, pas d'export comparatif, pas de vue multi-groupes
- les projets convertis avant l'ajout du snapshot n'ont pas de reference previsionnelle retroactive
- le suivi previsionnel vs reel V1 reste volontairement sobre : lecture portefeuille simple disponible, mais pas d'export de derives, pas de vue BI lourde et pas de versioning complexe du snapshot
- certains KPI restent volontairement `non disponibles` tant qu'aucune source fiable n'existe cote projet actuel (capital mobilise reel, marge reelle de revente, cash-flow reel complet)

**Garde-fous respectes V1 :**
- moins de 15 champs critiques obligatoires
- saisie rapide utilisable apres une visite d'opportunite
- pas d'IA, pas de moteur expert, pas de cash-flow ultra detaille
- calculs simples, comprehensibles, explicables
- calculs centralises cote backend
- taux departementaux sur l'ancien geres via une configuration centralisee par code departement, basee sur la grille officielle DGFiP DMTO au 1er fevrier 2026
- statut primo-accedant stocke dans la simulation pour preparer la logique reglementaire, sans modulation automatique appliquee a ce stade

## Conversion robuste et previsionnel vs reel

**Regle metier retenue :**
- une simulation ne peut etre convertie qu'une seule fois
- si une conversion existe deja, l'API bloque explicitement une nouvelle conversion avec un conflit metier au lieu de creer un doublon silencieux
- la conversion standard cree en une transaction le `Project`, ses `Lot` issus de la simulation, la trace `SimulationConversion` et le snapshot `ProjectForecastSnapshot`
- `SimulationConversion` est la source de verite metier de la conversion ; `Simulation.convertedProjectId` reste un raccourci de lecture maintenu pour les vues rapides et la compatibilite

**Endpoints concernes :**
- `GET /api/simulations/:simulationId/conversion-preview` : preview de conversion avec donnees transferees, lots, champs non repris, warnings, blocages et indicateur `canConvert`
- `POST /api/simulations/:simulationId/convert-to-project` : conversion effective avec regle stricte anti-doublon
- `GET /api/projects/:projectId/overview` : inclut maintenant un bloc `forecastComparison` quand le projet provient d'une conversion avec snapshot
- `GET /api/dashboard/drifts` : agrege les derives portefeuille a partir des comparaisons projet existantes, sans recalcul metier parallele

**Semantique HTTP sur les blocages de conversion :**
- `SIMULATION_ALREADY_CONVERTED` retourne `409 Conflict`
- `SIMULATION_ARCHIVED` retourne `422 Unprocessable Entity`
- les autres blocages metier de conversion retournent `422 Unprocessable Entity`
- les reponses d'erreur exposent aussi un `code` metier pour rester lisibles cote client et cote tests

**Modeles Prisma ajoutes / modifies :**
- `SimulationConversion` : trace minimale et exploitable de la conversion
- `ProjectForecastSnapshot` : reference immutable du previsionnel au moment de la conversion
- `Project.strategy` : conserve la strategie d'origine (`FLIP` ou `RENTAL`) sur le projet converti

**Snapshot previsionnel V1 :**
- stocke notamment prix d'achat, cout d'acquisition utile, frais de notaire, budget travaux, apport, montant du pret, mensualite estimee, duree estimee, revenu cible, marge/rendement/score/recommandation si disponibles, nombre et nature des lots, strategie et date de reference
- sert de base unique pour les comparaisons futures sans reinterpretion de la simulation
- reste immutable en V1 : pas de versioning, pas de recalcul retrospectif silencieux

**Tableau de bord "Previsionnel vs reel" V1 :**
- indicateurs face a face avec ecart absolu et ecart en pourcentage quand pertinent
- KPI actuellement calcules si la source existe : cout acquisition, budget travaux, cout total recalcule, nombre de lots, loyer mensuel, rendement brut
- les KPI non calculables proprement restent affiches comme `non disponibles`
- `acquisitionCost` est compare avec la meme definition des deux cotes
- `totalProjectCost` et `grossYield` sont recalcules cote projet sur une base homogene : cout d'acquisition actuel + enveloppe travaux la plus prudente (`max(budget actuel, depenses travaux engagees)`) + buffer fige a la conversion
- `lotsCount` compare les lots prepares au snapshot aux lots non archives actuellement presents sur le projet

**Alertes de derive V1 :**
- seuils simples et centralises cote backend
- budget travaux et cout total : `a surveiller` au-dela de `5%`, `en derive` au-dela de `10%`
- loyer et rendement : `a surveiller` au-dela de `10%` d'ecart defavorable, `en derive` au-dela de `15%`
- lots : alerte si le nombre reel s'ecarte de la structure previsionnelle
- dashboard portefeuille : `GET /api/dashboard/drifts` recompte les projets actifs en derive, a surveiller et sans reference, puis remonte les 3 projets les plus critiques avec leurs causes principales

**Prochaines etapes prioritaires :**
- enrichir la lecture portefeuille existante seulement si la source reste fiable et utile : filtres simples, drill-down plus direct ou export leger, sans basculer vers une vue analytics lourde
- comparaison multi-groupes ou exportable pour partage avec partenaires et financeurs
- historique enrichi si besoin avec niveau de justification supplementaire
- enrichissement du previsionnel vs reel avec de nouvelles sources fiables cote projet reel
- eventuel backfill explicite des anciens projets convertis si le produit le valide
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

## Landing publique et programme client pilote

La landing publique ne cherche pas à “mieux expliquer”.
Elle cherche à faire décider plus vite.

Positionnement retenu :

- cible explicite dès le hero : investisseurs immobiliers actifs, marchands de biens et petites structures qui pilotent plusieurs opérations en parallèle
- promesse centrale : voir rapidement quels projets sont `OK`, `À surveiller` ou `Problématique`
- ton direct, sélectif et sobre

Principes retenus pour la V2.2 :

- réduction agressive du texte
- une section = une information utile
- suppression des blocs redondants ou trop explicatifs
- lecture possible en diagonale
- CTA plus tôt dans la page et plus près des moments de tension

Décisions copy / conversion :

- suppression du bloc `Pour qui / Pas pour qui` de la lecture centrale pour gagner du scroll
- suppression du bloc produit redondant hors hero
- ajout d’un CTA rapide après le hero
- ajout d’un CTA intermédiaire après le bloc problème
- ajout d’un bloc de preuve concrète avec un exemple simplifié tiré du contexte de démo
- FAQ réduite aux objections critiques

Décisions prises sur la crédibilité :

- aucune promesse d’intégration, d’application mobile ou de fonctionnalité future non disponible
- aucune affirmation juridique ou sécurité non documentée sur la landing
- aucun compteur public tant qu’il n’est pas dynamique
- la crédibilité repose sur une preuve simple, l’hébergement et une approche sérieuse, pas sur du jargon

Règles typographiques appliquées :

- accents français rétablis sur tout le copy visible
- apostrophes typographiques `’`
- formulations visibles corrigées : `À surveiller`, `Problématique`, `aperçu`, `accès`, etc.

Flow retenu pour la landing V2.2 :

- hero
- CTA rapide
- problème
- CTA intermédiaire
- solution
- preuve concrète
- offre client pilote
- FAQ courte
- CTA final avec formulaire

Principe du programme client pilote :

- programme volontairement limité à un petit nombre de profils actifs
- tarif pilote : `15 € / mois`
- prix public visé hors programme : `29 € / mois`
- si un profil entre dans le programme pilote, il conserve son tarif pilote ensuite
- sélection humaine : le but est de trouver rapidement le bon contexte, pas d’ouvrir un signup massif

Fonctionnement du formulaire et des CTA :

- le CTA principal de la landing pointe vers le formulaire intégré en bas de page (`#access`)
- la route `/apply` expose le même formulaire dans une page dédiée pour partage direct
- juste au-dessus du formulaire, la landing affiche : `Réponse sous 24–48 h`, `Accès progressif`, `Aucun engagement`
- la micro-promesse associée est : `Vous saurez rapidement si Axelys est utile pour vos projets.`
- le formulaire demande : prénom, email, profil, nombre de projets actifs, message libre et acceptation du cadre pilote
- le submit passe par la route Next.js `apps/landing/app/api/pilot-applications/route.ts`, qui relaie ensuite vers l’API Nest `POST /api/pilot-applications`
- la landing utilise `API_URL` pour joindre l’API Nest ; en production, la valeur attendue est `https://api.axelys.app/api`

## Stack et architecture

- `apps/landing` : Next.js + TypeScript
- `apps/web` : React + Vite + TypeScript
- `apps/api` : NestJS + Prisma
- Base de donnees : PostgreSQL
- Architecture : monolithe modulaire multi-tenant

## URLs publiques de reference

- Landing publique : [https://axelys.app](https://axelys.app)
- Application produit : [https://app.axelys.app](https://app.axelys.app)
- API publique : [https://api.axelys.app](https://api.axelys.app)
- Expediteur transactionnel cible : `Axelys <no-reply@axelys.app>`

Notes utiles :

- l'application web Vite doit pointer vers `https://api.axelys.app/api` via `VITE_API_URL`
- l'API doit generer les liens utilisateur vers `https://app.axelys.app/...` via `APP_WEB_URL`
- la landing doit garder `https://axelys.app` comme URL canonique et source pour `metadata`, `robots` et `sitemap`
- l'API de production doit utiliser une `DATABASE_URL` poolée pour le runtime et une `DIRECT_URL` pour Prisma CLI / Studio
- la production ne doit pas utiliser de comptes seed ou de donnees de demonstration
- les comptes seed du repo restent reserves au local et aux tests

## Variables de deploiement

Landing (`apps/landing`) :

- `NEXT_PUBLIC_SITE_URL` : URL canonique publique de la landing
- `NEXT_PUBLIC_APP_URL` : URL publique de l application produit pour les liens de navigation depuis la landing
- `API_URL` : URL publique de l API Nest avec le prefixe `/api`, utilisee par la route serveur `apps/landing/app/api/pilot-applications/route.ts`

Valeurs de reference :

```env
NEXT_PUBLIC_SITE_URL=https://axelys.app
NEXT_PUBLIC_APP_URL=https://app.axelys.app
API_URL=https://api.axelys.app/api
```

API (`apps/api`) :

- `DATABASE_URL` : URL Prisma Postgres poolée pour le runtime
- `DIRECT_URL` : URL Prisma Postgres directe pour `prisma migrate deploy` et Prisma Studio
- `JWT_SECRET` : secret JWT long et aleatoire
- `APP_WEB_URL` : URL publique de `apps/web`, utilisee dans les emails d invitation admin
- `ALLOWED_ORIGINS` : liste CSV des origines navigateur autorisees en CORS
- `USER_INVITATION_TTL_HOURS` : duree de validite d un lien d invitation
- `MAIL_FROM` : expediteur transactionnel utilise par SMTP ou Resend
- `PILOT_NOTIFICATION_EMAIL` : boite qui recoit les candidatures client pilote
- `SMTP_HOST` : serveur SMTP optionnel
- `SMTP_PORT` : port SMTP optionnel
- `SMTP_USER` : identifiant SMTP optionnel
- `SMTP_PASS` : secret SMTP optionnel
- `SMTP_SECURE` : force le mode secure SMTP si besoin
- `RESEND_API_KEY` : cle API Resend optionnelle si SMTP n est pas configure
- `STRIPE_SECRET_KEY` : cle secrete Stripe serveur uniquement, jamais exposee au frontend
- `STRIPE_WEBHOOK_SECRET` : secret de signature du webhook Stripe
- `STRIPE_PRICE_PILOT_MONTHLY` : price id Stripe du plan `PILOT`
- `STRIPE_PRICE_STANDARD_MONTHLY` : price id Stripe du plan `STANDARD`
- `STRIPE_PRICE_PRO_MONTHLY` : price id Stripe du plan `PRO`
- `STRIPE_CHECKOUT_SUCCESS_URL` : URL de retour Stripe Checkout en cas de succes, purement UX
- `STRIPE_CHECKOUT_CANCEL_URL` : URL de retour Stripe Checkout en cas d annulation
- `STRIPE_PORTAL_RETURN_URL` : URL de retour du Billing Portal

Valeurs de reference :

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/immo_ops?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/immo_ops?schema=public
JWT_SECRET=replace-with-a-long-random-secret
APP_WEB_URL=https://app.axelys.app
ALLOWED_ORIGINS=https://app.axelys.app,https://axelys.app
USER_INVITATION_TTL_HOURS=72
MAIL_FROM="Axelys <no-reply@axelys.app>"
PILOT_NOTIFICATION_EMAIL=contact@axelys.app
# SMTP_HOST="smtp.example.com"
# SMTP_PORT=465
# SMTP_USER="smtp-user"
# SMTP_PASS="smtp-password"
# SMTP_SECURE=true
# RESEND_API_KEY=re_xxx
STRIPE_SECRET_KEY=sk_live_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
STRIPE_PRICE_PILOT_MONTHLY=price_replace_pilot
STRIPE_PRICE_STANDARD_MONTHLY=price_replace_standard
STRIPE_PRICE_PRO_MONTHLY=price_replace_pro
STRIPE_CHECKOUT_SUCCESS_URL=https://app.axelys.app/settings/billing/success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CHECKOUT_CANCEL_URL=https://app.axelys.app/settings/billing/cancel
STRIPE_PORTAL_RETURN_URL=https://app.axelys.app/settings/billing
```

App web (`apps/web`) :

- `VITE_API_URL` : URL publique de l API avec le prefixe `/api`

Valeur de reference :

```env
VITE_API_URL=https://api.axelys.app/api
```

Fichiers helper versionnes :

- `apps/landing/.env.example`
- `apps/api/.env.example`
- `apps/web/.env.prod.example`

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

4. Initialiser la base de demonstration :

```bash
pnpm prisma:migrate
pnpm db:demo-seed
```

5. Lancer les applications dans des terminaux separes depuis la racine :

```bash
pnpm dev:landing
pnpm dev:web
pnpm dev:api
```

## Billing Stripe cote API

L abonnement SaaS est maintenant **porte par `Organization`**, pas par le frontend et pas par la simple URL de succes Checkout.

Principes retenus :

- **source de verite = Stripe via webhook verifie**
- aucun acces payant n est accorde sur la seule redirection `success_url`
- le webhook `/api/stripe/webhook` verifie la signature Stripe avec le **raw body exact**
- les traitements webhook sont **idempotents** via la table `StripeWebhookEvent`
- les IDs Stripe et l etat courant sont synchronises sur `Organization`
- la politique d acces payant reste centralisee cote backend

Endpoints backend ajoutes :

- `POST /api/billing/checkout-session` : cree une Checkout Session Stripe pour un plan mensuel (`PILOT`, `STANDARD`, `PRO`)
- `POST /api/billing/portal-session` : cree une session Billing Portal pour l organisation courante
- `POST /api/stripe/webhook` : recoit et verifie les evenements Stripe publics

Evenements Stripe geres :

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Regle d acces retenue :

- acces organisation autorise si `billingStatus` vaut `ACTIVE` ou `TRIALING` **et** qu un plan Axelys connu est mappe
- acces refuse si `PAST_DUE`, `UNPAID`, `CANCELED`, `INCOMPLETE_EXPIRED` ou si le price id Stripe n est pas mappe a un plan applicatif
- les anciens overrides internes utilisateur (`subscriptionStatus`, `trialEndsAt`) restent compatibles comme mecanisme legacy, mais la voie standard SaaS est desormais le billing Stripe de l organisation

Variables importantes :

- `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` sont **deux secrets differents**
- le `whsec_...` local genere par Stripe CLI n est **jamais** le meme que celui du dashboard prod
- `STRIPE_CHECKOUT_SUCCESS_URL` sert a afficher un retour UX, pas a activer l abonnement

### Local Stripe CLI

1. Lancer l API localement :

```bash
pnpm dev:api
```

2. Ecouter les webhooks Stripe vers l API locale :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Recuperer le `whsec_...` affiche par Stripe CLI et le mettre dans `apps/api/.env` sous `STRIPE_WEBHOOK_SECRET`

4. Garder un autre `STRIPE_WEBHOOK_SECRET` en production, configure depuis le dashboard Stripe / Workbench

5. Tester ensuite Checkout ou des evenements :

```bash
stripe trigger invoice.payment_failed
stripe trigger invoice.paid
```

## Seed de demo produit

`pnpm db:demo-seed` relance un reset complet des donnees metier sans supprimer le schema PostgreSQL, nettoie les uploads seedes, puis recree un dataset de demonstration commerciale pense pour une demo produit.

Le dataset principal est concentre sur `Noroit Invest` avec :

- 6 projets volontairement contrastes pour montrer un portefeuille vivant
- des simulations structurees par dossiers d'opportunites
- des options actives et un historique de decisions sur plusieurs opportunites
- des projets convertis avec snapshot previsionnel pour alimenter les derives portefeuille
- 2 tenants secondaires tres legers pour verifier le multi-tenant sans polluer la demo principale

Le seed n'est donc pas un simple remplissage technique : il sert explicitement a illustrer l'aide a la decision avant achat puis le pilotage apres achat en moins de 3 minutes.

## Comptes de demo locaux

Apres `pnpm db:demo-seed` :

- `admin@example.com` / `admin123` : compte `SUPER_ADMIN`, acces a l'application produit et au back-office `/admin`, utilisateur pilote avec acces beta
- `user@example.com` / `user123` : collaborateur standard, acces a l'application produit
- `reader@example.com` / `reader123` : membre lecture seule

Organisation principale de demo : `Noroit Invest` (`noroit-invest`)

Portefeuille principal seed :

- `Immeuble de rapport - Roubaix Centre` : projet sain et complet
- `T2 meuble - Lille Fives` : projet a surveiller
- `Division pavillonnaire - Tourcoing` : projet problematique avec derive
- `Local commercial + logement - Arras` : projet incomplet
- `Colocation 4 chambres - Valenciennes` : projet issu d'un arbitrage de scenarios
- `Maison a renover - Lens` : derive portefeuille tres lisible

Le seed ajoute aussi deux idees de demonstration dans `Noroit Invest` pour verifier rapidement la page `/ideas` et le panneau beta pilote.

Ces comptes sont uniquement destines au developpement local et aux tests. Ils ne doivent pas etre recrees ni utilises en production.

## Invitation admin des utilisateurs

Le MVP n expose aucun signup public et n envoie jamais les invites vers la landing.
Le back-office `/admin` permet maintenant de :

- inviter un utilisateur avec `email + role membership` vers :
  - une organisation existante
  - ou un espace personnel
- envoyer un lien unique vers `https://app.axelys.app/setup-password`
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
- en production, `MAIL_FROM` doit rester `Axelys <no-reply@axelys.app>`
- toute future feature qui genere des emails, callbacks, liens de reset, invitations ou URLs absolues doit reutiliser `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `API_URL`, `APP_WEB_URL`, `ALLOWED_ORIGINS` et `VITE_API_URL` au lieu d une URL codée en dur
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
pnpm db:demo-seed
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
cd apps/api && pnpm test -- --runInBand
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
