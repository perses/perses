#!/bin/bash

## /!\ This file must be used at the root of the perses project
## This script automates the steps for running the api backend server during
## development.

echo ">> build the api server"
make build-api

if [[ $1 == "--e2e" ]]; then
  # deactivate the permission because e2e tests doesn't support yet the JWT cookies
  previous_file="./dev/config.previous.yaml"
  config_file="./dev/config.yaml"
  cp ${config_file} ${previous_file}
  sed 's/enable_auth: true/enable_auth: false/g' ${previous_file} >${config_file}
  rm ${previous_file}

  # install and overwrite the default plugins
  ./scripts/install_default_plugins.sh --overwrite true
fi

# Run backend server
echo ">> start the api server"
echo '>> Log in with user: `admin` and password: `password`'
./bin/perses -config ./dev/config.yaml
