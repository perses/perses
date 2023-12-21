#!/bin/bash

## /!\ This file must be used at the root of the perses project

set -e

function fmt() {
  # exclude migration files from the formatting since it removes the trailing commas we need
  find ./internal ./pkg ./cue/schemas -name "*.cue" -and -not -name "migrate.cue" -exec cue fmt {} \;
}

function checkfmt {
  fmt
  git diff --exit-code -- ./internal ./pkg ./cue/schemas
}

if [[ "$1" == "--fmt" ]]; then
  fmt
fi

if [[ "$1" == "--checkformat" ]]; then
  checkfmt
fi
