# BackOffice-Test (Angular)

Front back-office adapte a l API `Api-Test`.

## Etat du projet

- Architecture RBAC active (`ADMIN`, `LOGISTIQUE`, `COMPTABILITE`)
- Dashboards dedies par role
- Guards auth/role/permission actifs
- Validation encodee + lint + tests unitaires + e2e full valides

## Prerequis

- Node.js + npm
- API `Api-Test` lancee en mode e2e (`http://localhost:3001/api`)
- Base `test-api` migree + seedee

## Variables E2E

Fichier: `.env.e2e`

```env
E2E_API_URL=http://localhost:3001/api
E2E_ADMIN_EMAIL=admin1@test.local
E2E_ADMIN_PASSWORD=Admin123!
```

## Commandes

- `npm run check:encoding`
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run e2e`
- `npm run e2e:full`
- `npm start`

## Routes front (resume)

- Auth: `/login`, `/logout`
- Admin: `/admin/dashboard`, `/admin/users`, `/admin/audit-logs`, `/admin/categories`, `/admin/products`, `/admin/inventory`, `/admin/orders`, `/admin/payments`, `/admin/shipments`, `/admin/coupons`, `/admin/reviews`
- Logistique: `/logistique/dashboard`, `/logistique/inventory`, `/logistique/orders`, `/logistique/shipments`
- Comptabilite: `/comptabilite/dashboard`, `/comptabilite/orders`, `/comptabilite/payments`, `/comptabilite/coupons`
- Redirects role-aware: `/dashboard`, `/users`, `/orders`, etc.

## Contrat API attendu

- Auth cookies (`accessToken`, `refreshToken`) + CSRF
- Endpoints admin/public alignes swagger
- Formats listes:

```json
{
  "data": [],
  "page": 1,
  "limit": 20,
  "total": 0
}
```

## Validation executee

Validation complete passee sur cette base:

- `npm run check:encoding` OK
- `npm run lint` OK
- `npm run typecheck` OK
- `npm run test:unit` OK
- `npm run e2e:full` OK

## Notes

- Ce projet n est plus un socle minimal: c est une adaptation metier de reference.
- Pour un nouveau projet, partir du socle front (`BackOffice-Angular-Shell`) puis appliquer le playbook d adaptation.