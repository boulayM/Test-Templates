# Matrice de Traçabilité Exigences -> API -> Tests

Ce document mappe le cahier des besoins e-commerce vers:
- endpoints API implémentés,
- tests automatisés existants,
- statut de couverture.

Légende statut:
- `COUVERT`: endpoint + test(s) explicites présents.
- `PARTIEL`: endpoint présent, mais couverture de test incomplète ou non spécifique.
- `GAP`: besoin non implémenté ou non testé.

## 1) Acteurs et contrôle d'accès

| Besoin | Endpoints | Tests | Statut |
|---|---|---|---|
| Visiteur consulte catalogue/catégories | `GET /api/public/products`, `GET /api/public/categories` | `tests/api/public.spec.js`, `tests/api/e2e-client-flow.spec.js` | COUVERT |
| Client authentifié requis sur ressources privées | `/api/public/cart*`, `/api/public/orders*`, `/api/public/addresses*`, `/api/public/payments*`, `/api/public/shipments` | `tests/api/public.spec.js` | COUVERT |
| USER non autorisé sur endpoints admin | `/api/users`, `/api/audit-logs` | `tests/api/permissions.spec.js` | COUVERT |
| LOGISTIQUE permissions métier | `/api/admin/orders*`, `/api/admin/shipments*`, `/api/admin/inventory` | `tests/api/rbac-roles.spec.js` | COUVERT |
| COMPTABILITE permissions métier | `/api/admin/payments*` | `tests/api/rbac-roles.spec.js` | COUVERT |
| LOGISTIQUE/COMPTABILITE refus sur périmètres interdits | users/coupons/stock/livraison selon rôle | `tests/api/rbac-roles.spec.js` | COUVERT |

## 2) Catalogue

| Besoin | Endpoints | Tests | Statut |
|---|---|---|---|
| Catégories CRUD admin | `/api/admin/categories`, `/api/admin/categories/{id}` | `tests/api/admin.spec.js`, `tests/api/validation.spec.js`, `tests/api/e2e-client-flow.spec.js` | PARTIEL |
| Produits CRUD admin | `/api/admin/products`, `/api/admin/products/{id}` | `tests/api/admin.spec.js`, `tests/api/validation.spec.js`, `tests/api/e2e-client-flow.spec.js` | PARTIEL |
| Images produits admin | `/api/admin/images`, `/api/admin/images/{id}` | `tests/api/admin.spec.js` | PARTIEL |
| Listing public produits/catégories | `/api/public/products*`, `/api/public/categories*` | `tests/api/public.spec.js`, `tests/api/e2e-client-flow.spec.js` | COUVERT |
| Slugs uniques SEO | contraintes Prisma (`@unique`) | tests indirects | PARTIEL |

## 3) Comptes et adresses

| Besoin | Endpoints | Tests | Statut |
|---|---|---|---|
| Authentification login/refresh/logout/logout-all | `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/logout-all` | `tests/api/security.spec.js`, `tests/api/auth.spec.js`, `tests/api/e2e-client-flow.spec.js` | COUVERT |
| Rôles USER/ADMIN/LOGISTIQUE/COMPTABILITE | `User.role`, middleware permissions | `tests/api/permissions.spec.js`, `tests/api/rbac-roles.spec.js` | COUVERT |
| Utilisateurs admin (liste/create/update/delete/export) | `/api/users*`, `/api/admin/users*` | `tests/api/users.spec.js` | COUVERT |
| Profil utilisateur courant | `/api/auth/me`, `/api/users/me`, `/api/admin/users/me` | couverture partielle via smoke | PARTIEL |
| Adresses multiples + défaut | `/api/public/addresses*` | `tests/api/public.spec.js`, `tests/api/e2e-client-flow.spec.js` | PARTIEL |
| Désactivation compte | login/refresh/auth guard vérifient `isActive` | `tests/api/security.spec.js` | COUVERT |

## 4) Panier

| Besoin | Endpoints | Tests | Statut |
|---|---|---|---|
| Panier actif unique, ajout/modif/suppression lignes | `/api/public/cart`, `/api/public/cart/items`, `/api/public/cart/items/{id}` | `tests/api/public.spec.js`, `tests/api/validation.spec.js`, `tests/api/e2e-client-flow.spec.js` | COUVERT |
| Statuts panier ACTIVE/CONVERTED/ABANDONED | logique create order -> CONVERTED implémentée | couverture indirecte | PARTIEL |

## 5) Commandes

| Besoin | Endpoints | Tests | Statut |
|---|---|---|---|
| Création commande depuis panier | `POST /api/public/orders` | `tests/api/workflow.spec.js`, `tests/api/e2e-client-flow.spec.js`, `tests/api/business-rules.spec.js` | COUVERT |
| Historique client + détail | `GET /api/public/orders`, `GET /api/public/orders/{id}` | `tests/api/public.spec.js` | PARTIEL |
| Suivi admin + transitions | `GET /api/admin/orders*`, `PATCH /api/admin/orders/{id}/status` | `tests/api/workflow.spec.js`, `tests/api/rbac-roles.spec.js` | COUVERT |
| Règle transition invalide rejetée | transition `PENDING -> SHIPPED` | `tests/api/workflow.spec.js` | COUVERT |
| Règle annulation libère stock réservé | `PATCH /api/admin/orders/{id}/status` (`CANCELLED`) | `tests/api/business-rules.spec.js` | COUVERT |

## 6) Paiements

| Besoin | Endpoints | Tests | Statut |
|---|---|---|---|
| Création paiement client | `POST /api/public/payments` | `tests/api/public.spec.js`, `tests/api/e2e-client-flow.spec.js` | COUVERT |
| Consultation paiements | `GET /api/public/payments`, `GET /api/admin/payments` | `tests/api/public.spec.js`, `tests/api/admin.spec.js`, `tests/api/rbac-roles.spec.js` | COUVERT |
| Validation manuelle statuts | `PATCH /api/admin/payments/{id}/status` | `tests/api/rbac-roles.spec.js`, `tests/api/workflow.spec.js`, `tests/api/e2e-client-flow.spec.js` | COUVERT |
| Règle remboursement <= capturé | update payment status | `tests/api/business-rules.spec.js` | COUVERT |

## 7) Expédition

| Besoin | Endpoints | Tests | Statut |
|---|---|---|---|
| CRUD shipment admin | `/api/admin/shipments*` | `tests/api/admin.spec.js`, `tests/api/rbac-roles.spec.js`, `tests/api/workflow.spec.js`, `tests/api/e2e-client-flow.spec.js` | COUVERT |
| Suivi shipment client | `GET /api/public/shipments` | `tests/api/public.spec.js`, `tests/api/e2e-client-flow.spec.js` | COUVERT |
| Règle "expédition seulement si payé" | create shipment guard | `tests/api/business-rules.spec.js` | COUVERT |

## 8) Coupons

| Besoin | Endpoints | Tests | Statut |
|---|---|---|---|
| CRUD coupons admin | `/api/admin/coupons*` | `tests/api/admin.spec.js`, `tests/api/rbac-roles.spec.js` | PARTIEL |
| Validation coupon public | `GET /api/public/coupons/validate` | `tests/api/public.spec.js`, `tests/api/validation.spec.js` | COUVERT |
| Usage coupon en commande | `POST /api/public/orders` (couponCode) | couverture indirecte | PARTIEL |

## 9) Avis produits

| Besoin | Endpoints | Tests | Statut |
|---|---|---|---|
| Lister avis | `GET /api/public/reviews`, `GET /api/admin/reviews` | `tests/api/public.spec.js`, `tests/api/admin.spec.js` | PARTIEL |
| Créer/modifier/supprimer avis client | `/api/public/reviews*` | `tests/api/public.spec.js` | PARTIEL |
| Modération admin (delete) | `DELETE /api/admin/reviews/{id}` | `tests/api/admin.spec.js` | PARTIEL |
| "Un avis par produit acheté" | règle backend implémentée | `tests/api/reviews-rules.spec.js` | COUVERT |

## 10) Audit logs

| Besoin | Endpoints | Tests | Statut |
|---|---|---|---|
| Consultation audit logs admin | `/api/audit-logs*`, `/api/admin/audit-logs*` | `tests/api/audit-logs.spec.js`, `tests/api/permissions.spec.js` | COUVERT |
| Stockage base séparée MongoDB | couche audit log en place | testé partiellement selon env | PARTIEL |

## 11) Exigences sécurité et techniques

| Besoin | Endpoints / Composants | Tests | Statut |
|---|---|---|---|
| CSRF sur routes mutantes | middleware `verifyCsrf` | `tests/api/security.spec.js`, `tests/api/users.spec.js` | COUVERT |
| Rotation refresh token + revoke | auth refresh/logout-all | `tests/api/security.spec.js` | COUVERT |
| Validation Zod | middlewares validation | `tests/api/validation.spec.js` | COUVERT |
| Montants en centimes (pas float) | schéma Prisma + controllers | couvert implicitement | PARTIEL |
| Traçabilité timestamps | champs `createdAt/updatedAt` | couverture indirecte | PARTIEL |

## 12) Gaps prioritaires recommandés

1. Ajouter tests explicites sur:
- usage coupon dans commande (cas valide + invalide + limite usage).

2. Renforcer tests CRUD complets par domaine admin:
- catégories, produits, coupons, images, inventory, shipments.

3. Ajouter assertions métier chiffrées:
- cohérence `subtotal + shipping - discount = total` sur création commande.
