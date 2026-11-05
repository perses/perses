#!/bin/bash

## /!\ This file must be used at the root of the perses project

set -e

DIRS=(./internal ./pkg ./cue)

function fmt() {
  find "${DIRS[@]}" -name "*.cue" -exec cue fmt {} \;
}

function checkfmt {
  fmt
  git diff --exit-code -- "${DIRS[@]}"
}

if [[ "$1" == "--fmt" ]]; then
  fmt
fi

if [[ "$1" == "--checkformat" ]]; then
  checkfmt
fi
