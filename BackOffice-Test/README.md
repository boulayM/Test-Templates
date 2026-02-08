# BackOffice — Socle Front (Angular)

Ce projet est un socle front minimal pour back‑office, aligne sur une API securisee (JWT + CSRF + Zod).  
Il expose uniquement les pages suivantes : **login**, **logout**, **dashboard**, **users**, **audit-logs**.

## Objectifs du socle

- Base reutilisable pour demarrer un back‑office rapidement
- Integration simple avec une API REST standardisee
- Tests e2e et unitaires deja en place
- Structure stable et minimale (pas de dependances inutiles)

---

## Prerequis

- Node.js + npm
- API en fonctionnement (par defaut : `http://localhost:3000/api`)
- Base de donnees seeded avec un compte admin

---

## Configuration

Variables d'environnement utilisees par les tests e2e :

E2E_API_URL=http://localhost:3001/api
E2E_ADMIN_EMAIL=admin@test.local
E2E_ADMIN_PASSWORD=Admin123!
E2E_API_PATH=F:\Marc\Marc\DevWeb\Templates\TESTS\Api-Test

---

## Commandes principales

- `npm start` : lance le front (ng serve)
- `npm run build` : build production
- `npm run test:unit` : tests unitaires
- `npm run e2e` : tests e2e
- `npm run setup:e2e` : verifie l'API + lance le seed

---

## Contrat API attendu

Les endpoints du socle attendent un format de reponse standard :

### Listes

```json
{
  "data": [],
  "page": 1,
  "limit": 10,
  "total": 100
}
Exemples d'endpoints consommes
GET /api/users
POST /api/users/register
PATCH /api/users/:id
DELETE /api/users/:id
GET /api/audit-logs
GET /api/audit-logs/export
Structure du projet

src/
  app/
    features/
      admin/
        dashboard/
        users/
        audit-logs/
      auth/
        login/
        logout/
    core/
      services/
      guards/
      interceptors/
    layout/
    shared/
E2E (Playwright)
Les tests e2e verifient :

Authentification admin
CRUD Users
Audit logs
Export CSV
Certains tests sont conditionnels :

API indisponible => skip
Credentials manquants => skip
Details audit-logs si aucune ligne => skip
Notes importantes
L'API doit renvoyer les donnees avec les champs data, total, page, limit.
Le socle utilise csrf via interceptor pour les requetes non-GET.
Les pages dashboard sont des placeholders (exposes via DashboardDataService).
Reutilisation
Pour un nouveau projet :

Remplacer l'URL API
Adapter services si endpoints differents
Adapter schemas et e2e
Lancer npm run setup:e2e
```
