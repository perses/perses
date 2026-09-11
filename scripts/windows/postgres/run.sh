#!/bin/bash

# This script is used to run PostgreSQL in the CI for windows tests.
# Same reasoning as run-prometheus.sh: running a process in the background directly in GitHub Actions on windows is unreliable,
# so we use pg_ctl which is designed to start the server detached.

set -euo pipefail

user=${POSTGRES_USER:-user}
password=${POSTGRES_PASSWORD:-password}
database=${POSTGRES_DB:-perses}
port=${POSTGRES_PORT:-5432}

bin=postgres/bin
data=postgres/data

# start by removing any previous data directory, to ensure a clean state.
rm -rf "${data}"

# Write the password in a file so initdb doesn't prompt for it.
pwfile=$(mktemp)
echo "${password}" > "${pwfile}"

# Create the cluster: the superuser is created directly with the wanted username/password,
# so no additional role creation is needed afterwards.
"${bin}/initdb.exe" \
  --pgdata="${data}" \
  --username="${user}" \
  --pwfile="${pwfile}" \
  --auth=scram-sha-256 \
  --encoding=UTF8 \
  --no-locale
rm -f "${pwfile}"

# Start the server detached. pg_ctl -w waits until the server accepts connections.
"${bin}/pg_ctl.exe" \
  --pgdata="${data}" \
  --log=postgres/postgres.log \
  --options="-p ${port}" \
  --wait \
  start

# Wait until the server is really ready to accept queries.
until "${bin}/pg_isready.exe" --host=localhost --port="${port}" --quiet; do
    echo >&2 'PostgreSQL not ready, retrying in 1s...'
    sleep 1
done

# Create the database used by the tests.
PGPASSWORD="${password}" "${bin}/createdb.exe" --host=localhost --port="${port}" --username="${user}" "${database}"

echo >&2 'PostgreSQL up, exiting'
