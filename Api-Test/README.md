# Api-Express-Shell (Socle Core)

Socle d API pour projets bases sur Prisma.

## Stack

- Node.js + Express
- Prisma + PostgreSQL (adapter-pg)
- JWT (cookies HttpOnly)
- Refresh tokens stockes haches en base
- CSRF double submit cookie
- Validation Zod
- Audit logs Mongo optionnels

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

## Notes

- CSRF requis pour les routes qui modifient les donnees.
- /users/register (admin) requiert CSRF.
- Audit logs optionnels; desactive via ENABLE_AUDIT_LOG=false.
- Refresh token en rotation avec detection de reutilisation (reuse detection).
- Mettre a jour `docs/swagger.yaml` quand les routes changent.
