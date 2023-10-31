#!/bin/bash

## /!\ This file must be used at the root of the perses project
## This script automates the steps for running the api backend server during
## development.

echo ">> build the api server"
make build-api

if [[ $1 == "--e2e" ]]; then
  # deactivate the permission because e2e tests doesn't support yet the JWT cookies
  sed 's/activate_permission: true/activate_permission: false/g' ./dev/config.yaml
fi

# Run backend server
echo ">> start the api server"
./bin/perses -config ./dev/config.yaml
