#!/usr/bin/env bash
set -euo pipefail

ROOT="/workspaces/Test-Templates"

for app in Api-Test BackOffice-Test Public-Test; do
  echo "==> Installing dependencies for $app"
  (cd "$ROOT/$app" && npm ci --legacy-peer-deps)
done

echo "==> Installing Playwright browsers"
(cd "$ROOT/BackOffice-Test" && npx playwright install --with-deps chromium)
(cd "$ROOT/Public-Test" && npx playwright install --with-deps chromium)

echo "==> Post-create complete"
