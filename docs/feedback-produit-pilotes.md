# Feedback produit et clients pilotes

## Objectif

Ajouter une boucle de feedback tres simple et coherente avec Axelys :

1. un utilisateur propose une idee
2. les autres utilisateurs de la meme organisation votent
3. l equipe Axelys decide du statut
4. une idee peut passer en beta pour les clients pilotes
5. validation
6. release globale

Le systeme reste volontairement minimal :

- pas de commentaires
- pas de notifications
- pas de tags complexes
- pas de logique sociale
- pas de roadmap automatique basee sur les votes

## Choix multi-tenant

Le choix retenu est **organisation-scoped**.

Pourquoi :

- `AGENTS.md` impose que les tables metier portent `organizationId`
- les endpoints produit ne recoivent jamais `organizationId` depuis le body
- toutes les requetes Prisma business doivent filtrer par `organizationId`

Consequence :

- un utilisateur ne voit que les idees de son organisation courante
- les votes sont eux aussi scopes par `organizationId`
- le back-office admin interne garde une vue transverse globale

## Modeles

### User

Ajouts :

- `isPilotUser: boolean`
- `betaAccessEnabled: boolean`

Regle simple :

- `betaAccessEnabled` n a de sens que si `isPilotUser = true`
- si un utilisateur sort du programme pilote, l acces beta est coupe

### FeatureRequest

Champs :

- `id`
- `organizationId`
- `authorId`
- `title`
- `description`
- `votesCount`
- `status`
- `createdAt`
- `updatedAt`

Statuts :

- `OPEN`
- `PLANNED`
- `IN_PROGRESS`
- `DONE`
- `REJECTED`

### FeatureRequestVote

Champs :

- `id`
- `organizationId`
- `userId`
- `featureRequestId`
- `createdAt`

Contrainte :

- unicite `(featureRequestId, userId)` pour garantir `1 user = 1 vote max`

## API

Produit :

- `GET /api/ideas`
- `GET /api/ideas/beta`
- `POST /api/ideas`
- `POST /api/ideas/:featureRequestId/vote`
- `DELETE /api/ideas/:featureRequestId/vote`

Admin :

- `PATCH /api/admin/users/:userId/pilot-access`
- `GET /api/admin/ideas`
- `PATCH /api/admin/ideas/:featureRequestId/status`

## UX V1

- page produit simple sur `/ideas`
- mention explicite : les votes aident a prioriser, ils ne decident pas automatiquement
- badge `Beta` visible sur les idees `IN_PROGRESS`
- badge `Pilote` et indication d acces beta pour les utilisateurs concernes
- message de prudence : `Vous testez des fonctionnalites en cours de validation.`

## Limites V1

- pas de commentaires
- pas de moderation communautaire
- pas de scoring avance
- pas de pondération technique des votes
- pas de feature flags complexes
- pas de billing specifique pilote
