#!/bin/bash

## /!\ This file must be used at the root of the perses project
## This script provides utils method to help to release and verify the readiness of each libs under the folder ui/

set -e

cd ui/

files=("../LICENSE" "../CHANGELOG.md")
workspaces=$(jq -r '.workspaces[]' < package.json)
publish_workspaces=$(for workspace in ${workspaces}; do 
  # packages are private so we shouldn't try to publish them.
  # TODO: see if we can do something smarter here by checking for "private" set
  # to true in a given package's package.json.
  if [[ "${workspace}" != "app" ]] && [[ "${workspace}" != "e2e" ]] && [[ "${workspace}" != "storybook" ]]; then
    echo $workspace;
  fi 
done)

function copy() {
  for file in "${files[@]}"; do
    for workspace in ${workspaces}; do
      if [ -f "${file}" ]; then
        cp "${file}" "${workspace}"/"$(basename "${file}")"
      fi
    done
  done
}

function publish() {
  dry_run="${1}"
  cmd="npm publish --access public"
  if [[ "${dry_run}" == "dry-run" ]]; then
    cmd+=" --dry-run"
  fi
  for workspace in ${publish_workspaces}; do
    cd "${workspace}"
    eval "${cmd}"
    cd ../
  done

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

function clean() {
  for file in "${files[@]}"; do
    for workspace in ${workspaces}; do
      f="${workspace}"/"$(basename "${file}")"
      if [ -f "${f}" ]; then
        rm "${f}"
      fi
    done
  done
}

function bumpVersion() {
  version="${1}"
  if [[ "${version}" == v* ]]; then
    version="${version:1}"
  fi
  # upgrade the @perses-dev/* dependencies on all packages
  for workspace in ${workspaces}; do
    # sed -i syntax is different on mac and linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -E -i "" "s|(\"@perses-dev/.+\": )\".+\"|\1\"${version}\"|" "${workspace}"/package.json
    else
      sed -E -i "s|(\"@perses-dev/.+\": )\".+\"|\1\"${version}\"|" "${workspace}"/package.json
    fi
  done

  # increase the version on all packages
  npm version "${version}" --workspaces
}

# Validates branch name and extracts snapshot name from it.
function getBranchSnapshotName() {
  branch="${1}"

  snapshotRegex="^snapshot\/[-a-zA-Z0-9]+$"

  if [[ ! $branch =~ $snapshotRegex ]]; then 
    echo "Snapshot branch '${branch}' must start with 'snapshot/' and end with a kebab-case name (e.g. 'snapshot/my-feature')." 1>&2
    exit 1
  fi

  # Replace "/"" with "-"
  echo "$(echo "${branch}" | sed -E  's/\//-/')"
}

function snapshotVersion() {
  # Use version 0.0.0 to keep snapshots at the bottom of the npm versions UI to 
  # avoid confusion for consumers of the package. This also helps differentiate
  # snapshots from the concept of prereleases.
  version="0.0.0"
  
  branch="${1}"
  sha="${2}"
  shortSha=$(echo $sha | cut -c 1-7)

  branchSnapshotName=$(getBranchSnapshotName $branch)
  snapshotVersion="${version}-${branchSnapshotName}-${shortSha}"
  echo "Creating snapshot ${snapshotVersion}"

  # Save snapshot version
  echo "${snapshotVersion}" > ../VERSION

  bumpVersion "${snapshotVersion}"
  checkPackage "${snapshotVersion}"
}


function publishSnapshot() {
  branch="${1}"
  tagName=$(getBranchSnapshotName $branch)

  echo "Publishing snapshot to tag ${tagName}"
  cmd="npm publish --access public --tag ${tagName}"
  for workspace in ${publish_workspaces}; do
    cd "${workspace}"
    eval "${cmd}"
    cd ../
  done
}

function removeSnapshot() {
  branch="${1}"
  tagName=$(getBranchSnapshotName $branch)

  echo "Removing snapshot for tag ${tagName}"
  for workspace in ${publish_workspaces}; do
    cd "${workspace}"
    eval "npm dist-tag rm @perses-dev/${workspace} ${tagName}"
    cd ../
  done
}

if [[ "$1" == "--copy" ]]; then
  copy
fi

if [[ $1 == "--publish" ]]; then
  publish "${@:2}"
fi

if [[ $1 == "--check-package" ]]; then
  checkPackage "${@:2}"
fi

if [[ $1 == "--bump-version" ]]; then
  bumpVersion "${@:2}"
fi

if [[ $1 == "--clean" ]]; then
  clean
fi

if [[ $1 == "--snapshot-version" ]]; then
  snapshotVersion "${@:2}" "${@:3}"
fi

if [[ $1 == "--publish-snapshot" ]]; then
  publishSnapshot "${@:2}"
fi

if [[ $1 == "--remove-snapshot" ]]; then
  removeSnapshot "${@:2}"
fi
