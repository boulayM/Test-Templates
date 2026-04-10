# Public-Test

Front public Angular adapte au projet Ma Boutique.
Ce projet est une implementation concrete issue du socle public Angular, avec catalogue produits, pages compte, charte graphique et medias produits.

## Objectif

- fournir le front public concret du projet Ma Boutique
- consommer l API `Api-Test` via cookies HttpOnly + CSRF + refresh token
- exposer le catalogue, les pages produits et les pages compte utilisateur
- servir de reference d adaptation du socle public Angular

## Prerequis

- Node.js 20+ recommande
- npm 10+
- API `Api-Test` disponible

## Scripts cross-platform

Tous les scripts npm sont compatibles Windows/Linux/macOS:
- checks e2e en `node` (`scripts/*.mjs`)
- variables d environnement via `cross-env`
- pas de dependance `powershell` dans `package.json`

Commandes usuelles:

```bash
npm start
npm run e2e
```

## Architecture

```text
src/app/
  core/
    guards/
    interceptors/
    services/
  features/
    auth/
    public/
    account/
  layout/
  shared/
```

## Routes

Publiques:
- `/home`
- `/catalog`
- `/products/:id`
- `/info/contact`
- `/info/mentions-legales`
- `/login` (guest only)
- `/register` (guest only)
- `/verify-email`

Protegees:
- `/dashboard`
- `/account/addresses`
- `/account/cart`
- `/account/orders`
- `/account/profile`
- `/checkout`
- `/payment/:orderId`

Acces URL directe sans session:
- redirection vers `/login?redirect=<url-demandee>`

## Auth et securite

- auth via cookies HttpOnly cote API
- CSRF via endpoint `/csrf` + interceptor
- utilisateur courant recupere via `GET /auth/me`
- guards: `authGuard`, `roleGuard`, `guestGuard`

## Variables d environnement

Aucun fichier `.env*` n est versionne.
Les variables doivent etre definies dans le shell local, les secrets CI, ou la configuration de l hebergeur.

Variables E2E usuelles:

```powershell
$env:E2E_API_URL="http://localhost:3001/api"
$env:E2E_API_PATH="F:\Marc\Marc\DevWeb\Templates\TESTS\Test-Templates\Api-Test"
$env:E2E_RUN_SEED="true"
$env:E2E_ALLOW_SEED="isolated"
```

Protocole recommande:
1. Demarrer l API en `dev:e2e`.
2. Lancer `npm run e2e`.
3. N activer le seed que pour une base e2e isolee sur le port `3001`.

`setup:e2e`:
- verifie API reachability
- probe `/csrf`
- seed optionnel uniquement si:
  - `E2E_RUN_SEED=true`
  - `E2E_ALLOW_SEED=isolated`
  - `E2E_API_PATH` est renseigne explicitement
  - `E2E_API_URL` cible le port `3001`

## Scripts utiles

- `npm run check:encoding`
- `npm run check:dom-xss`
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run setup:e2e`
- `npm run e2e`
- `npm run e2e:seeded`
- `npm run e2e:seo`
- `npm run seo:check`

## SEO

- metadata route-level (`data.seo`)
- `SeoService` central (title/meta/canonical/robots)
- Open Graph + Twitter cards
- JSON-LD sur pages indexables
- checklist: `docs/seo-checklist.md`

## Docker local

Une dockerisation locale standalone est disponible pour lancer le front public comme application statique servie par Nginx.

### Fichiers

- `Dockerfile`
- `.dockerignore`
- `docker/nginx/default.conf`
- `docker/nginx/docker-entrypoint.sh`
- `src/env.js`

### Build

```powershell
docker build -t public-test .
```

### Run

```powershell
docker run --rm -p 4202:80 -e API_URL=http://localhost:3000/api public-test
```

### URL utile

- Front public : `http://localhost:4202`

### Notes

- `API_URL` est injectee au runtime via `env.js`.
- Les URLs images `/media/...` sont resolues a partir de l origine de `API_URL`.
- En local Docker, ce front peut parler a l API exposee sur `http://localhost:3000/api`.
- Cette dockerisation n a pas d impact sur le lancement Angular classique via `npm start`.

## Adaptation vers un autre projet

1. brancher l API cible via `environment.apiUrl` ou `API_URL` en Docker
2. mapper `catalog`, `products/:id` et les pages account au domaine metier
3. aligner les messages UI sur le contrat d erreur API
4. completer les e2e metier du projet
