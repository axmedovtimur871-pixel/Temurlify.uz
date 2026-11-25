#!/usr/bin/env bash
# Apply all migrations to a fresh local Postgres database and run flow tests.
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${DB:-temurlify_test}
su postgres -c "dropdb --if-exists $DB; createdb $DB"
for f in supabase/tests/local-shim.sql supabase/migrations/*.sql; do
  su postgres -c "psql -q -v ON_ERROR_STOP=1 -d $DB -f $PWD/$f" >/dev/null 2>&1 || { echo "FAILED: $f"; su postgres -c "psql -q -v ON_ERROR_STOP=1 -d $DB -f $PWD/$f"; exit 1; }
done
su postgres -c "psql -q -v ON_ERROR_STOP=1 -d $DB -f $PWD/supabase/tests/flows.sql" 2>&1 | grep -E "ERROR|PASSED|CONTEXT"
