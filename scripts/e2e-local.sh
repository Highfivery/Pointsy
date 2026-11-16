#!/usr/bin/env bash
# Run the full Playwright + axe suite locally against a throwaway Postgres —
# the same job GitHub Actions used to run (see docs in AGENTS.md).
#
# Never touches .env.local's database: it starts a disposable postgres:16
# container, migrates it, runs every Playwright project, then removes it.
# Extra args pass through to Playwright, e.g. `npm run test:e2e:local -- -g picker`.
set -euo pipefail

PORT="${E2E_DB_PORT:-55433}"
APP_PORT="${E2E_APP_PORT:-3300}"
NAME="pointsy-e2e-$$"
URL="postgres://pointsy:pointsy@localhost:${PORT}/pointsy"

if ! docker info >/dev/null 2>&1; then
  echo "Docker isn't running. Start Docker Desktop and try again." >&2
  exit 1
fi

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --rm --name "$NAME" \
  -e POSTGRES_USER=pointsy -e POSTGRES_PASSWORD=pointsy -e POSTGRES_DB=pointsy \
  -p "${PORT}:5432" postgres:16 >/dev/null

echo "Waiting for Postgres on :${PORT}…"
for _ in $(seq 1 30); do
  docker exec "$NAME" pg_isready -U pointsy >/dev/null 2>&1 && break
  sleep 1
done

# Both vars set so drizzle-kit (which prefers DIRECT_DATABASE_URL) and the app
# use the throwaway DB, never the one in .env.local.
export DATABASE_URL="$URL" DIRECT_DATABASE_URL="$URL"
export AUTH_SECRET="local-e2e-secret-at-least-32-characters-long"
export PLAYWRIGHT_BASE_URL="http://localhost:${APP_PORT}"
export PORT="$APP_PORT"

npm run db:migrate
npx playwright install chromium webkit >/dev/null
npx playwright test --workers="${E2E_WORKERS:-2}" "$@"
