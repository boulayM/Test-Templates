# BackOffice-Test Release

## Version
- 1.0.0

## Scope
- Back-office Angular adapte a l API `Api-Test`.
- RBAC front actif (`ADMIN`, `LOGISTIQUE`, `COMPTABILITE`).
- Dashboards par role + modules metier admin/compta/logistique.

## Validation
- `npm run lint` OK
- `npm run typecheck` OK
- `npm run test:unit` OK
- `npm run e2e:full` OK

## Notes
- Setup e2e automatise via `scripts/setup-e2e.mjs`.
- Controle securite DOM: `npm run check:dom-xss`.
