#!/bin/bash

## /!\ This file must be used at the root of the perses project

set -e

function checkVersion() {
  version=${1}
  if [[ "${version}" =~ ^v[0-9]+(\.[0-9]+){2}(-.+)?$ ]]; then
    echo "version '${version}' follows the semver"
  else
    echo "version '${version}' doesn't follow the semver"
    exit 1
  fi
}

function tag() {
  version="${1}"
  tag="v${version}"
  branch=$(git branch --show-current)
  checkVersion "${tag}"
  expectedBranch="release/$(echo "${tag}" | sed -E  's/(v[0-9]+\.[0-9]+).*/\1/')"

  if [[ "${branch}" != "${expectedBranch}" ]]; then
    echo "you are not on the correct release branch (i.e. not on ${expectedBranch}) to create the tag"
    exit 1
  fi

  git pull origin "${expectedBranch}"
  git tag -s "${tag}" -m "${tag}"
}

function extractChangelog() {
  sed -n '/^##/,/^##/{/^##/!{/^##/!p;};}' CHANGELOG.md > GENERATED_CHANGELOG.md
}

if [[ $1 == "--check-version" ]]; then
  checkVersion "${@:2}"
fi

if [[ $1 == "--tag" ]]; then
  tag "${@:2}"
fi

if [[ $1 == "--extract-changelog" ]]; then
  extractChangelog
fi
