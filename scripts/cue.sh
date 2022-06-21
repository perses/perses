#!/bin/bash

## /!\ This file must be used at the root of the perses project

set -e

function test() {
  cd schemas/charts
  for d in *; do
    if [ -d "${d}" ]; then
      echo "testing charts ${d}"
      cue vet "${d}/${d}.json" "${d}/${d}.cue"
    fi
  done
}

function fmt() {
  find ./internal ./pkg ./schemas -name "*.cue" -exec cue fmt {} \;
}

function checkfmt {
  fmt
  git diff --exit-code -- ./internal ./pkg ./schemas
}

if [[ "$1" == "--fmt" ]]; then
  fmt
fi

if [[ "$1" == "--checkformat" ]]; then
  checkfmt
fi

if [[ $1 == "--test" ]]; then
  test
fi
