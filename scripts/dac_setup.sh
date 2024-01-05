#!/bin/bash
set -e

usage="
Usage: $(basename "$0") [-h] [-v VERSION]
This script takes care of adding the CUE sources from Perses as external dependencies to your DaC repo.
/!\ It must be executed at the root of your repo.

Options:
    -h  show this help text
    -v  version of Perses (in the form of \"X.Y.Z\") from which to retrieve the dependencies

Example: 
$ ./dac_setup.sh -v 0.42.1"

function dacSetup() {
    echo "Starting DaC setup with Perses version $VERSION"

    # Create the destination folder (see https://cuelang.org/docs/concepts/packages/)
    mkdir -p cue.mod/pkg/github.com/perses/perses

    # Download  & extract sources
    curl -L https://github.com/perses/perses/archive/refs/tags/v$VERSION.tar.gz --output sources.tar.gz
    tar -xzf sources.tar.gz

    # Copy the dependencies to the destination folder
    cd perses-$VERSION
    cp -r --parents cue ../cue.mod/pkg/github.com/perses/perses

    # Cleanup
    cd ..
    rm sources.tar.gz
    rm -r perses-$VERSION/

    echo "DaC setup finished"
}

options=':hv:'
while getopts $options option; do
  case "$option" in
    h) echo "$usage"; exit;;
    v) VERSION=$OPTARG;;
    :) printf "missing argument for -%s\n" "$OPTARG" >&2; echo "$usage" >&2; exit 1;;
   \?) printf "illegal option: -%s\n" "$OPTARG" >&2; echo "$usage" >&2; exit 1;;
  esac
done

# mandatory arguments
if [ ! "$VERSION" ]; then
  echo "argument -v must be provided"
  echo "$usage" >&2; exit 1
fi

dacSetup