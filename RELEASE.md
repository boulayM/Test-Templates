# Release notes

## Iteration Docker et front public

Cette iteration consolide le projet de demonstration autour des trois acteurs principaux :

- `Api-Test`
- `BackOffice-Test`
- `Public-Test`

### API

L'API contient maintenant les assets images utilises par la demonstration e-commerce.

Les images produits sont servies par l'API depuis les chemins media publics et sont consommees par le front public pour afficher le catalogue, les details produits et les visuels de la vitrine.

### Front public

Le front public a ete remplace par une version plus proche d'une vitrine e-commerce reelle :

- charte graphique plus aboutie ;
- visuels produits ;
- affichage des images servies par l'API ;
- pages catalogue et detail produit alignees avec les donnees exposees par l'API.

Le front public peut toujours etre deploye separement sur Render, mais il est maintenant aussi present dans le monorepo afin de conserver une coherence entre l'API, le backoffice et la vitrine publique.

### Docker

Les trois projets disposent maintenant d'une integration Docker.

Un `docker-compose.yml` racine permet de lancer l'ensemble du projet localement :

```bash
docker compose --profile demo up --build
```

Le profil `demo` orchestre le demarrage dans cet ordre :

```text
postgres
seed
api
backoffice + public
```

Le seed execute :

```bash
npx prisma migrate deploy
npx prisma db seed
```

La base ciblee par ce flux est la base PostgreSQL Docker du compose. Les donnees de production Alwaysdata ne sont pas concernees.

### Codespaces

Le repository peut etre teste dans GitHub Codespaces par un visiteur technique disposant d'un compte GitHub.

Le Codespace permet de lancer le compose sans installer localement Node, PostgreSQL ou Docker sur la machine du visiteur.
