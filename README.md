# Test-Templates

Monorepo de projets de test autour des socles templates.

## Projets inclus

- `Api-Test` : API Express/Prisma adaptee au cas e-commerce (auth, RBAC, catalogue, commandes, etc.).
- `BackOffice-Test` : Front Angular back-office connecte a l API (admin, operations, controle metier).
- `Public-Test` : Front Angular public connecte a l API (catalogue, compte utilisateur, panier, checkout).

## Objectif du repository

Fournir un espace de validation et de demonstration des adaptations realisees a partir des socles (API + fronts).

## Demo publique

La demo publique peut etre exposee via les services de production separes :

- API et base PostgreSQL : Alwaysdata.
- Fronts Angular : Render.

Cette architecture de production reste separee du Docker Compose local de ce repository.

## Lancement local avec Docker Compose

Le repository fournit un `docker-compose.yml` a la racine pour lancer l'ensemble du projet en local :

- PostgreSQL dans Docker.
- API Express/Prisma.
- Backoffice Angular.
- Front public Angular.

Commande recommandee pour obtenir un environnement de demo complet et reseede :

```powershell
docker compose --profile demo up --build
```

Services exposes :

```text
API          http://localhost:3000/api
Backoffice   http://localhost:4201
Front public http://localhost:4202
```

Le profil `demo` lance le flux suivant :

```text
postgres demarre
seed execute migrate deploy + prisma db seed
api demarre ensuite
backoffice et public demarrent ensuite
```

Le seed cible uniquement la base PostgreSQL Docker du projet :

```text
postgresql://postgres:postgres@postgres:5432/api_test?schema=public
```

Il ne cible ni la base de developpement locale Windows, ni la base Alwaysdata.

## Lancement via GitHub Codespaces

Un visiteur technique peut tester le projet sans cloner le repository localement en utilisant GitHub Codespaces.

Depuis GitHub :

```text
Code -> Codespaces -> Create codespace on main
```

Puis, dans le terminal Codespaces :

```bash
docker compose --profile demo up --build
```

GitHub proposera ensuite l'ouverture des ports du Codespace. Les ports utiles sont :

```text
3000 API
4201 Backoffice
4202 Front public
```

Le Codespace appartient a l'utilisateur qui l'ouvre et consomme ses propres quotas GitHub Codespaces. Il ne s'agit pas d'une demo publique permanente : pour une consultation simple, les liens Render restent preferables.
