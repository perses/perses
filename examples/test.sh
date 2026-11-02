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

  pnpm install --no-frozen-lockfile 2>&1 | tee out.log
  if grep -q ERR_PNPM_ out.log; then
    exit 1
  fi
  pnpm run type-check
  pnpm run build

  popd
done
