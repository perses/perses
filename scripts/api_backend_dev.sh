#!/bin/bash

## /!\ This file must be used at the root of the perses project
## This script automates the steps for running the api backend server during
## development.

echo ">> build the api server"
make build-api

# Run backend server
echo ">> start the api server"
./bin/perses -config ./dev/config.yaml
