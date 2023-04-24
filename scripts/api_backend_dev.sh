#!/bin/bash

## /!\ This file must be used at the root of the perses project
## This script automates the steps for running the api backend server during
## development.

localDBFolder="dev/local_db"

# Populate database
function generateLocalDB() {
  echo ">> populate the local database"
  cd dev
  rm -rf local_db
  ./populate.sh
  cd ../
}

function buildAPI() {
    # Make api
    echo ">> build the api server"
    make build-api
}

if ! [[ -d "${localDBFolder}" ]]; then
  generateLocalDB
fi

if [[ "$1" == "--override" ]]; then
  generateLocalDB
fi

buildAPI

# Run backend server
echo ">> start the api server"
./bin/perses -config ./dev/config.yaml
