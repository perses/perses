#!/bin/bash

set -euo pipefail

overwrite=false
github_url="https://github.com/perses/perses-plugins/releases/download"

# Parse command-line options
while [[ $# -gt 0 ]]; do
  case $1 in
    --overwrite)
      shift
      overwrite=$1
      shift
      ;;
    *)
      break
      ;;
  esac
done


mkdir -p "./plugins-archive"

while IFS=$'\t' read -r name version _; do
  echo "downloading plugin ${name}-${version}"
  curl -s -L -o "./plugins-archive/${name}-${version}.tar.gz" "${github_url}/${name}-${version}/${name}-${version}.tar.gz" &
done < <(yq e '.[] | [.name, .version] | @tsv' ./scripts/plugin/plugin.yaml)

wait
