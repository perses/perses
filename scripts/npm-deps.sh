#!/bin/bash

function ncu() {
    target=$1
    npx npm-check-updates -u --target "${target}"
}

cd ui/
for workspace in $(cat package.json | jq -r '.workspaces[]'); do
  cd ${workspace}
  ncu "$1"
  cd ../
done; \

ncu "$1"
npm install
