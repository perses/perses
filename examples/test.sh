#!/bin/bash
set -eux

for example in */;
do
  pushd $example

  pnpm install |& tee out.log
  if grep -q ERESOLVE out.log; then
    exit 1
  fi
  pnpm build

  popd
done
