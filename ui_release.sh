#!/bin/bash

cd ui/

workspaces=$(npm ls --production --depth 1 -json | jq -r '.dependencies[].resolved[11:]')

function copy() {
  files=("../LICENSE" "../CHANGELOG" ".npmignore")
  for file in "${files[@]}"; do
    for workspace in ${workspaces}; do
      cp "${file}" "${workspace}"/"$(basename "${file}")"
    done
  done
}

function publish() {
  npm publish --workspaces
}

if [[ "$1" == "--copy" ]]; then
  copy
fi

if [[ $1 == "--publish" ]]; then
  publish
fi
