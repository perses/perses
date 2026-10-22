#!/bin/bash
set -euxo pipefail

# Build the examples given as arguments, or all of them when none is provided.
if [ $# -gt 0 ]; then
  examples=("$@")
else
  examples=(*/)
fi

for example in "${examples[@]}";
do
  pushd "$example"

  npm install |& tee out.log
  if grep -q ERESOLVE out.log; then
    exit 1
  fi
  npm run type-check
  npm run build

  popd
done
