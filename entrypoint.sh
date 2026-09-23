#!/bin/sh
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"

echo "[entrypoint] Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
node -e "
  const net = require('net');
  const tryConnect = () => new Promise((resolve, reject) => {
    const s = net.createConnection({ host: '${DB_HOST}', port: ${DB_PORT} });
    s.once('connect', () => { s.end(); resolve(); });
    s.once('error', () => reject());
  });
  (async () => {
    while (true) {
      try { await tryConnect(); process.exit(0); }
      catch { process.stderr.write('[entrypoint]   PostgreSQL is unavailable - sleeping 2s\n'); await new Promise(r => setTimeout(r, 2000)); }
    }
  })();
" || true
echo "[entrypoint] PostgreSQL is up ✓"

if [ "$1" = "--no-migrate" ]; then
  echo "[entrypoint] Skipping migrations (--no-migrate flag)"
  shift
else
  echo "[entrypoint] Running database migrations..."
  npx sequelize-cli db:migrate || {
    echo "[entrypoint] ⚠ Migration failed — continuing anyway"
  }

  echo "[entrypoint] Running seeders..."
  npx sequelize-cli db:seed:all || {
    echo "[entrypoint] ⚠ Seeding failed — continuing anyway"
  }
fi

echo "[entrypoint] Starting application..."
exec "$@"
