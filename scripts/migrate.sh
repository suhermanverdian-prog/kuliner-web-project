#!/usr/bin/env bash
# migrate.sh – Apply database migrations for the Coffeeshop backend
# ---------------------------------------------------------------
# This script runs the SQL file located at backend/db/migration.sql
# using the PostgreSQL client (psql). It expects the following
# environment variables to be set (you can copy them from .env):
#   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
# Example usage:
#   export PGHOST=your-host.supabase.co
#   export PGPORT=5432
#   export PGUSER=postgres
#   export PGPASSWORD=your-secret
#   export PGDATABASE=coffeeshop
#   ./scripts/migrate.sh
# ---------------------------------------------------------------
set -euo pipefail
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SQL_FILE="$SCRIPT_DIR/../backend/db/migration.sql"
if [[ ! -f "$SQL_FILE" ]]; then
  echo "❌ Migration file not found: $SQL_FILE"
  exit 1
fi
echo "🚀 Applying migration..."
psql "postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE" -f "$SQL_FILE"
echo "✅ Migration completed successfully."
