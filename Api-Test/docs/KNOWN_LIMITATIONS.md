# Limites connues - API Test

Date : 24/02/2026

Cette API est un socle de test et intègre volontairement des parties non finalisées.

## Endpoints volontairement partiels

- `GET /api/public/payments/providers/status`
- `GET /api/public/shipments/providers/status`

Comportement attendu en mode test :

- `501 Not Implemented` lorsqu'aucun provider de paiement/livraison n'est configuré.
- `200 OK` est également accepté si un provider est configuré plus tard.

## Impact QA

Les assertions Postman/Newman sont alignées sur ce contrat (`200` ou `501`) et incluent des tests explicites documentant cette limite.
