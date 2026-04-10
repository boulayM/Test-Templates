# Public-Test

Front public Angular adapte au projet e-commerce de reference.

## Objectif
- fournir un parcours public simple (home + catalogue + compte);
- consommer l API `Api-Test` (auth cookies, CSRF, endpoints e-commerce);
- conserver une base reutilisable via composants/shared et services core.

## Architecture

```
src/app/
  core/
    guards/          # authGuard, authMatchGuard, guestGuard
    interceptors/    # auth/csrf
    services/        # api/auth/csrf/content/activity/seo
  features/
    auth/            # login/register/verify-email
    public/          # home/catalogue
    account/         # profile/panier
  layout/
    authenticated-layout/
  shared/
    components/
    messages/
    models/
    utils/
```

Conventions techniques:
- formulaires auth en Reactive Forms types;
- etat UI local via Angular Signals (`signal`/`computed`);
- feedback formulaire accessible via `aria-live` sur `FormAlertComponent`.

## Routes principales

Routes publiques:
- `/home`
- `/login` (guest only)
- `/register` (guest only)
- `/verify-email`

Routes authentifiees:
- `/dashboard` (redirection vers `/catalog`)
- `/catalog`
- `/account/cart`
- `/account/profile`

Acces URL directe (sans session):
- les routes protegees redirigent vers `/login?redirect=<url-demandee>`;
- pas de page blanche: le flux est gere par `authGuard`.

Aliases legacy (compatibilite migration):
- `/public/content` -> `/catalog`
- `/account/activity` -> `/account/cart`

## Contrat front <-> API

Le front expose des routes utilisateur e-commerce et mappe vers l API via services `ContentService` et `ActivityService`.

Exemples:
- catalogue: `/api/public/categories` + `/api/public/products`
- panier: `/api/public/cart` (GET/POST/PATCH/DELETE)

## Auth et securite
- auth par cookies HttpOnly (geres cote API);
- CSRF via `/api/csrf` + interceptor;
- guards:
  - `authGuard` protege l espace authentifie;
  - `guestGuard` bloque `/login` et `/register` pour un user deja connecte.

## SEO

- metadata route-level via `data.seo` dans `src/app/app.routes.ts`
- application automatique `title/meta/canonical/robots` via `SeoService`
- OG + Twitter minimales (`og:*`, `twitter:*`)
- image sociale par defaut: `src/assets/og-default.svg`
- JSON-LD `WebSite` injecte uniquement sur pages indexables
- pages auth et compte en `noindex,nofollow`

Validation SEO: `docs/seo-checklist.md`.

## Scripts utiles

Qualite:
- `npm run check:encoding`
- `npm run check:dom-xss`
- `npm run lint`
- `npm run typecheck`

Tests:
- `npm run test:unit`
- `npm run e2e`
- `npm run e2e:ui`

E2E setup:
- `npm run setup:e2e`
- lit `.env.e2e` pour `E2E_API_URL` (par defaut `http://localhost:3001/api`)
- verifie reachability API avant Playwright

## Validation actuelle

Derniere verification:
- `lint` OK
- `typecheck` OK
- `test:unit` OK
- `playwright e2e` OK (`5 passed`, `1 skipped` optionnel seed/login)

## Checklist de validation finale

- [ ] API lancee en `dev:e2e` sur `3001` avant e2e front
- [ ] routes publiques/protegees valides
- [ ] redirection login sur acces route protegee sans session
- [ ] metadata SEO active par route
- [ ] `check:encoding` + `check:dom-xss` + `lint` + `typecheck` + `test:unit` + `e2e` OK

## Notes

Le test e2e "seeded user can login and open profile" est optionnel et demande:
- API disponible;
- donnees e2e pre-seedees;
- variables e2e compatibles.

## SEO validation

- `npm run seo:check` : verification statique (title/description/canonical/robots/social setup)
- `npm run e2e:seo` : verification meta tags au runtime (serveur dedie port 4210)
- Lighthouse/DevTools (manuel): verifier LCP/CLS/INP sur `/home`, `/catalog`, `/categories`
- Preview social (manuel): verifier OG/Twitter avec URL publique de test

