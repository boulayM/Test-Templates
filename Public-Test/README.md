# Public-Angular-Shell

Socle frontend Angular abstrait pour projets "front public + compte utilisateur".  
Le shell est volontairement neutre metier: il peut etre adapte a des cas e-commerce, institutionnels ou services.

## Objectif
- fournir une base Angular moderne (standalone, guards, interceptors);
- exposer une structure claire `public / account / auth`;
- rester compatible avec une API securisee (cookies HttpOnly + CSRF + refresh token);
- permettre des adaptations rapides sans repartir de zero.

## Architecture actuelle

```
src/app/
  core/
    guards/          # authGuard, roleGuard, guestGuard
    interceptors/    # auth/csrf
    services/        # api/auth/csrf/domain
  features/
    auth/            # login/register/verify-email
    public/          # home/content public
    account/         # profile/activity utilisateur
  layout/
    authenticated-layout/
  shared/
    components/
    messages/
    models/
    utils/
```

## Routes

Routes publiques:
- `/home`
- `/login` (guest only)
- `/register` (guest only)
- `/verify-email`

Routes authentifiees:
- `/dashboard`
- `/public/content`
- `/account/activity`
- `/account/profile`

Acces URL directe (sans session):
- les routes protegees redirigent vers `/login?redirect=<url-demandee>`;
- pas de page blanche: le flux est gere par `authGuard`.

## Contrat d abstraction front <-> API

Ce shell expose un vocabulaire front abstrait (`content`, `activity`) qui n impose pas les noms de ressources backend.

Exemples:
- Front `content` peut pointer vers n importe quelle ressource API de consultation/liste.
- Front `activity` peut pointer vers n importe quel workflow utilisateur (demandes, dossiers, actions, etc.).

Important:
- l API socle minimale (`Api-Express-Shell`) n expose pas d endpoints `/products` ou `/orders`;
- elle expose surtout `/api/auth/*`, `/api/users/*`, `/api/audit-logs/*`, `/api/csrf`.
- le mapping concret se fait pendant l adaptation projet, dans les services Angular.

## Auth et securite
- auth par cookies HttpOnly (geres par API);
- CSRF via endpoint `/csrf` + interceptor;
- guards:
  - `authGuard` protege l espace authentifie;
  - `roleGuard` applique le role autorise (`USER` par defaut dans ce shell);
  - `guestGuard` bloque `/login` et `/register` pour un user deja connecte.

## Register et services externes (email/captcha)

Le front supporte une page register dediee (pas de modale), plus robuste pour:
- captcha;
- messages d indisponibilite backend (`503`);
- mobile/accessibilite.

Configuration front:
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Flags frontend:
- `captchaEnabled`
- `captchaSiteKey`

Comportement:
- si `captchaEnabled=true`, la page register affiche un bloc captcha/token;
- sinon, le bloc captcha est masque.

Note: la verite metier reste cote API (feature flags backend).

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

## Validation actuelle (socle)

Derniere verification:
- `lint` OK
- `typecheck` OK
- `playwright e2e` OK (`5 passed`, `1 skipped` optionnel selon credentials e2e)

## Checklist de validation finale

- [ ] routes publiques et protegees accessibles selon role/etat auth
- [ ] register en page dediee, sans blocage UX
- [ ] messages clairs en cas d indisponibilite backend (`503`)
- [ ] captcha visible seulement si active cote env front
- [ ] `check:encoding` + `check:dom-xss` OK
- [ ] `lint` + `typecheck` + `e2e` OK

## Adaptation vers un projet concret

1. Brancher `environment.apiUrl` sur l API cible.
2. Mapper les composants `public/content` et `account/activity` vers le domaine metier cible.
3. Activer/desactiver captcha selon besoins.
4. Aligner les messages UI avec le contrat d erreur de l API.
5. Completer les e2e metier apres adaptation.
