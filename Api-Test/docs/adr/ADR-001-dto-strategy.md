# ADR-001 - Strategie DTO

## Statut

Adopté

## Date

2026-02-24

## Contexte

L'API e-commerce a été adaptée sous contrainte de délai avec un objectif prioritaire: livrer des flux fonctionnels verifies.

L'entité `User` est la plus sensible (donnees personnelles, role, auth) et nécessite un contrôle strict du contrat de sortie pour éviter toute fuite de champs.

Les autres entités (catalogue, commandes, paiements, expeditions, coupons, avis) étaient déjà cadrées par:

- validation d entree via schemas Zod,
- selection/mapping Prisma au niveau controllers/services,
- tests fonctionnels de parcours.

## Decision

Nous appliquons une stratégie hybride:

- DTO explicite pour `User` (fichier `src/dto/user.dto.js`).
- Pas de DTO dédié pour les autres entités pour l'instant.

## Raisons

- Réduire le risque sur les données les plus sensibles.
  -Éviter un surcoût de maintenance immédiat (duplication DTO + mapping + tests) sans besoin critique sur toutes les entités.
- Preserver la vitesse de livraison du scope e-commerce.

## Consequences

Positives:

- Contrat de sortie robuste sur `User`.
- Meilleur contrôle des champs exposes dans les routes auth/admin users.
- Time-to-delivery conservé.

Negatives:

- Hétérogénéité temporaire dans la couche de sortie.
- Dette technique de convergence vers une stratégie uniforme.

## Alternatives considérées

1. DTO sur toutes les entités
   - Avantage: architecture uniforme.
   - Inconvenient: coût de mise en place/maintenance plus élevé a court terme.

2. Aucun DTO
   - Avantage: implementation rapide.
   - Inconvenient: risque plus élevé de fuite de champs sensibles, notamment sur `User`.

## Critères de revision

Revaluation nécessaire si:

- rupture de contrat API récurrente,
- nouvelles exigences de gouvernance/schema contract tests,
- extension du projet vers un mode produit plus durable.

## Plan de convergence (propose)

1. Phase 1: Auth/Users (deja en place)
2. Phase 2: Orders/Payments/Shipments
3. Phase 3: Catalog/Reviews/Coupons

Chaque phase devra inclure:

- DTO/serializer de sortie,
- tests de contrat,
- mise a jour Swagger/documentation.
