#!/bin/bash

## /!\ This file must be used at the root of the perses project

set -e

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
