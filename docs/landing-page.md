# Landing page et go-to-market

## 1. Role de la landing

La landing marketing sert a presenter clairement le positionnement du produit sans elargir le scope du MVP visible.

Elle doit rester alignee avec l application :

- detail projet comme centre de gravite
- projets, lots, depenses, documents, KPI fiables et export CSV comme coeur visible
- ton sobre, credible, orientee pilotage

La landing ne doit pas promettre :

- gestion locative avancee
- ERP immobilier
- automatisations avancees
- reporting portefeuille complexe

## 2. Stack retenue

La landing marketing vit dans `apps/landing`.

Choix retenu :

- Next.js
- TypeScript
- page marketing statique pour demarrer

L application produit continue de vivre dans `apps/web` avec React + Vite.

## 3. Direction visuelle

La landing doit reprendre les codes de l app existante :

- fond clair texture
- cartes blanches legerement translucides
- accent bleu
- hierarchy simple et lisible
- focus sur les chiffres, les contenus utiles et la clarte

## 4. Pricing de depart

La structure commerciale initiale retient 3 offres :

- Free
- Pro : 29 EUR / mois
- Business : 59 EUR / mois

Le detail exact de ce que chaque offre debloque sera arbitre plus tard.

Point deja acte :

- tous les utilisateurs n auront pas acces aux memes fonctionnalites selon leur offre
- la logique de limitation par plan devra etre prise en compte dans le produit et la communication

## 5. Paiements

Le paiement n est pas implemente a ce stade.

Decision de cadrage :

- le choix cible pour les paiements sera Revolut

Ce point est documente maintenant mais ne doit pas encore guider l implementation technique du MVP visible.
