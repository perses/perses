#!/bin/bash

## /!\ This file must be used at the root of the perses project
## This script automates the steps for running the api backend server during
## development.

# Populate database
echo ">> populate the local database"
cd dev 
rm -rf local_db
./populate.sh

# Make api
echo ">> build the api server"
cd ..
make build-api

# Run backend server
echo ">> start the api server"
./bin/perses -config ./dev/config.yaml