#!/bin/bash
set -eux

for example in */;
do
  pushd $example

  npm install |& tee out.log
  if grep -q ERESOLVE out.log; then
    exit 1
  fi
  npm run build

  popd
done
