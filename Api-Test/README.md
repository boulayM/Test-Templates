# Api-Test (Socle adapte e-commerce)

API Express + Prisma adaptee au besoin e-commerce (front public + back-office admin).

## Stack

- Node.js + Express
- Prisma + PostgreSQL (adapter-pg)
- JWT (cookies HttpOnly)
- Refresh tokens stockes haches en base
- CSRF double submit cookie
- Validation Zod
- Audit logs Mongo optionnels

## Etat d adaptation (snapshot)

- Domaine e-commerce implemente: catalogue, comptes/adresses, panier, commandes, paiements, expeditions, coupons, avis, audit logs.
- Couverture automatisée: `64` tests (`npm test`) verts.
- Matrice exigences -> API -> tests: `docs/requirements-traceability.md`.
- Points encore partiels:
  - Statuts panier `ACTIVE/CONVERTED/ABANDONED`: coverage explicite `ABANDONED` a completer.
  - Validation persistence audit logs selon environnement Mongo cible.

## Prerequis

- Node.js 18+
- PostgreSQL
- (Optionnel) MongoDB pour audit logs

## Env

Cree un `.env` (exemples):
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/mirror-api?schema=public
ACCESS_TOKEN_SECRET=change-me
REFRESH_TOKEN_SECRET=change-me
FRONT_URL=http://localhost:4200

ENABLE_AUDIT_LOG=false
MONGODB_URI=mongodb://localhost:27017/audit
REGISTRATION_ENABLED=true
EMAIL_VERIFICATION_REQUIRED=true
REGISTRATION_CAPTCHA_REQUIRED=false

## Install

npm install
npx prisma generate

## Base de donnees

npx prisma migrate dev
npx prisma db seed

## Run

npm run dev

## Routes Core

- GET /api/csrf
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/verify-email
- GET /api/auth/me
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/logout-all
- GET /api/users
- GET /api/users/export
- POST /api/users/register (CSRF requis)
- PATCH /api/users/:id
- DELETE /api/users/:id
- GET /api/audit-logs (necessite Mongo + ENABLE_AUDIT_LOG=true)
- GET /api/audit-logs/export (necessite Mongo + ENABLE_AUDIT_LOG=true)
- GET /api/audit-logs/:id (necessite Mongo + ENABLE_AUDIT_LOG=true)

## Routes e-commerce (principales)

- Public:
  - `GET /api/public/categories`
  - `GET /api/public/products`
  - `GET /api/public/inventory`
  - `GET /api/public/reviews`
  - `GET|POST|PATCH|DELETE /api/public/addresses`
  - `GET /api/public/cart`, `POST /api/public/cart/items`, `PATCH|DELETE /api/public/cart/items/:id`, `POST /api/public/cart/abandon`
  - `GET|POST /api/public/orders`, `GET /api/public/orders/:id`
  - `GET|POST /api/public/payments`
  - `GET /api/public/shipments`
  - `GET /api/public/coupons/validate`
- Admin:
  - `GET|POST|PATCH|DELETE /api/admin/categories`
  - `GET|POST|PATCH|DELETE /api/admin/products`
  - `GET|POST|DELETE /api/admin/images`
  - `GET|POST|PATCH /api/admin/inventory`
  - `GET|POST|PATCH|DELETE /api/admin/coupons`
  - `GET|PATCH /api/admin/payments`
  - `GET|POST|PATCH|DELETE /api/admin/shipments`
  - `GET|PATCH /api/admin/orders`
  - `GET|POST|PATCH|DELETE /api/admin/users`
  - `GET|DELETE /api/admin/reviews`
  - `GET /api/admin/audit-logs` (bridge vers audit logs)

## Notes

- CSRF requis pour les routes qui modifient les donnees.
- /users/register (admin) requiert CSRF.
- Audit logs optionnels; desactive via ENABLE_AUDIT_LOG=false.
- Refresh token en rotation avec detection de reutilisation (reuse detection).
- Mettre a jour `docs/swagger.yaml` quand les routes changent.
- Verification complete locale:
  - `npm run lint`
  - `npm test`
- Rapport de cloture adaptation:
  - `docs/adaptation-final-report.md`
