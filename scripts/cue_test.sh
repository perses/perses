#!/bin/bash

## /!\ This file must be used at the root of the perses project

set -e

cd schemas/charts

for d in * ; do
  if [ -d "${d}" ]; then
    echo "testing charts ${d}"
    cue vet "${d}/${d}.json" "${d}/${d}.cue"
  fi
done
