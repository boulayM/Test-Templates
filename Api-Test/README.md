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

## CI (GitHub Actions)

Pipeline: `.github/workflows/ci.yml`

Checks executes on `push`/`pull_request` (main/master):

- `npm run check:encoding`
- `npm run lint`
- `npm test` (with PostgreSQL + Mongo services)
- `npm run build`

Equivalent local command:

```powershell
npm run ci:check
```

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
- GET /api/audit-logs (nécessite Mongo + ENABLE_AUDIT_LOG=true)
- GET /api/audit-logs/export (nécessite Mongo + ENABLE_AUDIT_LOG=true)
- GET /api/audit-logs/:id (nécessite Mongo + ENABLE_AUDIT_LOG=true)

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

## Runs Newman (Postman CLI)

Executer les deux suites séparées (admin et user) avec l'environnement local:

```powershell
newman run postman/api-test-admin.postman_collection.json `
  -e postman/Api-Test.postman_environment.json `
  -r "cli,htmlextra" `
  --reporter-htmlextra-export ".\postman\reports\report-admin.html"

newman run postman/api-test-user.postman_collection.json `
  -e postman/Api-Test.postman_environment.json `
  -r "cli,htmlextra" `
  --reporter-htmlextra-export ".\postman\reports\report-user.html"
```

Notes QA:

- Les collections sont séparées pour éviter l'écrasement de session entre login admin et login user.
- Les endpoints provider status (`/api/public/payments/providers/status`, `/api/public/shipments/providers/status`) peuvent retourner `501` en mode test (provider non configure).
- Voir `docs/KNOWN_LIMITATIONS.md`.

## Notes

- CSRF requis pour les routes qui modifient les donnees.
- /users/register (admin) requiert CSRF.
- Audit logs optionnels; désactive via ENABLE_AUDIT_LOG=false.
- Refresh token en rotation avec detection de réutilisation (reuse detection).
- Mettre a jour `docs/swagger.yaml` quand les routes changent.
- Verification complete locale:
  - `npm run lint`
  - `npm test`
- Rapport de cloture adaptation:
  - `docs/adaptation-final-report.md`
- Stratégie DTO: `docs/adr/ADR-001-dto-strategy.md`.


## Docker local

Une dockerisation locale isolee est disponible pour lancer l API avec un PostgreSQL local, sans impact sur la production.

### Fichiers

- `Dockerfile`
- `.dockerignore`
- `docker-compose.yml`

### Lancement

```powershell
docker compose up --build
```

### Arret

```powershell
docker compose down
```

### Arret avec suppression du volume PostgreSQL local

```powershell
docker compose down -v
```

### URLs utiles

- API : `http://localhost:3000`
- Swagger JSON : `http://localhost:3000/api/swagger.json`
- Docs : `http://localhost:3000/api/docs`
- Media : `http://localhost:3000/media/...`

### Notes

- Cette configuration Docker est locale et isolee.
- Elle utilise une base PostgreSQL Docker dediee, distincte de toute base Alwaysdata.
- Les migrations Prisma sont appliquees au demarrage du conteneur API via `prisma migrate deploy`.
- Les audit logs Mongo sont desactives par defaut dans cette configuration (`ENABLE_AUDIT_LOG=false`).
