#!/bin/bash

cd ui/

workspaces=$(npm ls --production --depth 1 -json | jq -r '.dependencies[].resolved[11:]')

function copy() {
  files=("../LICENSE" "../CHANGELOG" ".npmignore")
  for file in "${files[@]}"; do
    for workspace in ${workspaces}; do
      cp "${file}" "${workspace}"/"$(basename "${file}")"
    done
  done
}

function publish() {
  npm publish --workspaces
}

function checkPackage() {
  version=${1}
  if [[ "${version}" == v* ]]; then
    version="${version:1}"
  fi
  for workspace in ${workspaces}; do
    cd "${workspace}"
    package_version=$(npm run env | grep npm_package_version | cut -d= -f2-)
    if [ "${version}" != "${package_version}" ]; then
      echo "version of ${workspace} is not the correct one"
      echo "expected one: ${version}"
      echo "current one: ${package_version}"
      echo "please use ./ui_release --release ${version}"
      exit 1
    fi
    cd ..
  done
}

function prepareRelease() {
  version=${1}
  if [[ "${version}" == v* ]]; then
    version="${version:1}"
  fi
  npm version "${version}" --workspaces
}

if [[ "$1" == "--copy" ]]; then
  copy
fi

if [[ $1 == "--publish" ]]; then
  publish
fi


if [[ $1 == "--check" ]]; then
  checkPackage "${@:2}"
fi

if [[ $1 == "--release" ]]; then
  prepareRelease "${@:2}"
fi
