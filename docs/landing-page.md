# Landing page et go-to-market

## 1. Rôle de la landing

La landing marketing sert à qualifier vite les bons profils, montrer clairement la valeur visible du produit et convertir vers une demande d’accès `client pilote` crédible.

Positionnement retenu :

- cible explicite : investisseurs immobiliers actifs, marchands de biens et petites structures qui pilotent plusieurs opérations en parallèle
- promesse visible en quelques secondes : piloter avec des faits, pas avec des impressions
- angle de lecture : voir rapidement quels projets sont `OK`, `À surveiller` ou `Problématique`
- ton direct, sobre, sélectif, sans sur-promesse ni verbiage

Elle doit rester alignée avec l’application :

- détail projet comme centre de gravité
- projets, lots, dépenses, documents, KPI fiables et alertes comme cœur visible
- aide à la décision avant storytelling marketing

La landing ne doit pas promettre :

- gestion locative avancée
- ERP immobilier
- automatisations avancées
- reporting portefeuille complexe
- import Excel automatique s’il n’existe pas encore
- application mobile ou intégrations qui ne sont pas disponibles

## 2. Stack retenue

La landing marketing vit dans `apps/landing`.

Choix retenu :

- Next.js
- TypeScript
- page marketing statique pour demarrer

L application produit continue de vivre dans `apps/web` avec React + Vite.

## 3. Direction visuelle

La landing doit reprendre les codes de l’app existante tout en assumant une lecture plus tranchée :

- fond clair travaillé, sans effet gadget
- cartes lisibles et sobres
- accent bleu conservé
- hiérarchie visuelle nette, peu de texte avant les CTA
- focus sur la décision, les preuves utiles et la qualification rapide

## 4. Principes de copywriting V2.1

- réduire le volume de texte et supprimer les répétitions
- une section = une idée nouvelle
- phrases courtes et lisibles sur mobile
- ton direct mais respectueux
- aucune affirmation juridique, sécurité ou roadmap qui ne peut pas être soutenue
- typographie française correcte sur tout le copy visible

## 5. Structure retenue pour la landing V2.1

- hero cible/promesse avec CTA principal vers le formulaire et CTA secondaire vers l’aperçu produit
- bloc `Pour qui / Pas pour qui`
- bloc `Problème`
- CTA intermédiaire
- bloc `Comment Axelys aide à décider`
- bloc `Aperçu produit` contextualisé
- bloc `Offre client pilote` fusionné
- bloc `Crédibilité`
- FAQ resserrée
- CTA final avec vrai formulaire intégré

## 6. Programme client pilote

Le programme client pilote n’est pas un faux waitlist marketing.

- programme limité à un petit nombre de profils actifs
- tarif pilote : `15 € / mois`
- prix public visé hors programme : `29 € / mois`
- les profils retenus conservent leur tarif pilote ensuite
- aucun compteur public de places restantes sur la landing tant que la donnée n’est pas dynamique

## 7. Formulaire et CTA

- le CTA principal de la landing mène vers le formulaire intégré en bas de page
- la route `/apply` reprend le même formulaire dans une page dédiée
- champs minimaux : prénom, email, profil, nombre de projets actifs, message libre et acceptation du cadre pilote
- le submit passe par la route Next.js `apps/landing/app/api/pilot-applications/route.ts`, puis vers l’API Nest `POST /api/pilot-applications`
- aucun signup public automatique n’est ajouté

## 8. Paiements

Le paiement n’est pas implémenté à ce stade.

Décision de cadrage :

- le choix cible pour les paiements sera Revolut

Ce point est documenté maintenant mais ne doit pas encore guider l’implémentation technique du MVP visible.
