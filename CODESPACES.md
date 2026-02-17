# Codespaces Quick Start (Test-Templates)

## 1) Create Codespace

- Open this repository in GitHub Codespaces.
- Wait for `.devcontainer/post-create.sh` to finish.

## 2) Configure env files

Inside `Api-Test`, set DB URLs for Codespaces PostgreSQL (`postgres/postgres`):

- `.env.dev`
- `.env.e2e`
- `.env.test`

Recommended host: `localhost:5432`.

## 3) Initialize API database

```bash
cd /workspaces/Test-Templates/Api-Test
npm run preflight:e2e
npx dotenv -e .env.e2e -- prisma migrate reset --force
```

## 4) Run apps

Terminal 1:

```bash
cd /workspaces/Test-Templates/Api-Test
npm run dev:e2e
```

Terminal 2:

```bash
cd /workspaces/Test-Templates/Public-Test
npm start
```

Terminal 3:

```bash
cd /workspaces/Test-Templates/BackOffice-Test
npm start -- --port 4201
```

## 5) Run e2e

Public:

```bash
cd /workspaces/Test-Templates/Public-Test
npm run e2e
```

BackOffice:

```bash
cd /workspaces/Test-Templates/BackOffice-Test
npm run e2e
```

## Notes

- API must be running in `dev:e2e` before front e2e.
- `setup:e2e` now uses cross-platform Node scripts.
- If seed fails with missing table, run `prisma migrate reset` on the same target DB, then retry.
