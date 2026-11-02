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

  # Fail on peer dependency conflicts (pnpm only warns about them by default)
  pnpm install --no-frozen-lockfile --strict-peer-dependencies
  pnpm run type-check
  pnpm run build

  popd
done
