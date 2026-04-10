# Api-Test Release

## Version
- 1.0.0

## Scope
- API e-commerce adaptee sur base Express + Prisma + PostgreSQL.
- RBAC admin/public, auth cookies + CSRF, endpoints e-commerce complets.
- Audit logs Mongo optionnels.
- Assets produits integres a l'API pour servir les images de la demonstration e-commerce.
- Seed mis a jour pour exposer des visuels produits consommables par le front public.

## Validation
- `npm run lint` OK
- `npm test` OK

## Notes
- Contrat OpenAPI: `docs/swagger.yaml`.
- Rapport adaptation: `docs/adaptation-final-report.md`.
- Les images produits sont servies depuis les chemins media publics de l'API et restent dediees a l'usage demo.
