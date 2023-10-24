#!/bin/bash

# This script is only useful when running in the github action.
# It helps to override the VERSION variable in the Makefile that happens when we want to push a docker image from the main branch.
# On the main branch, we want to highlight that the docker image built is not coming from a standard release

dateNow=$(date +%Y-%m-%d)
shortCommit=$(git log -n1 --format="%h")

echo "VERSION=main-${dateNow}-${shortCommit}" >>"${GITHUB_ENV}"
