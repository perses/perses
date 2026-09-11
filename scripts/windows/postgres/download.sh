#!/bin/bash

# This script is used to download the PostgreSQL binaries in the CI for windows tests.
# It downloads the portable zip archive published by EDB, which doesn't require any installer or Windows service.

set -euo pipefail

# Full version required by the EDB download URL (major.minor-build).
version=${POSTGRES_VERSION:-17.4-1}

url="https://get.enterprisedb.com/postgresql/postgresql-${version}-windows-x64-binaries.zip"

echo >&2 "Downloading PostgreSQL ${version} from ${url}"
curl --silent --show-error --fail -L "${url}" -o postgresql.zip

# The archive contains a top-level "pgsql" folder.
unzip -q postgresql.zip
rm -f postgresql.zip
mv pgsql postgres

# Not needed for the tests, keep the workspace small.
rm -rf postgres/pgAdmin\ 4 postgres/symbols postgres/doc postgres/include
