# Public-Test Release

## Version
- 1.0.0

## Scope
- Front public Angular adapte au cas e-commerce Ma Boutique.
- Vitrine publique plus realiste : hero produit, catalogue, details produits, parcours compte et checkout.
- Integration des images produits servies par l'API.
- Configuration runtime `env.js` pour permettre un deploiement statique ou Docker sans recompiler l'application.

## Validation
- `npm run lint` OK
- `npm run typecheck` OK
- `npm run build` OK

## Notes
- Le front public consomme l'API via `API_URL`.
- En deploiement statique, `src/env.js` peut rester neutre afin de laisser Angular utiliser `environment.prod.ts`.
- En Docker, `docker/nginx/docker-entrypoint.sh` genere `env.js` au demarrage du conteneur.
