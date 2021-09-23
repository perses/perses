#!/bin/bash

exclude_directories=("./ui/node_modules" ".git" ".idea" ".github")

function buildExcludeDirectories() {
  local result
  for dir in "${exclude_directories[@]}"; do
    result+=" ! -path ${dir}"
  done
  echo "${result}"
}

function buildPatternList() {
  local patterns=("$@")
  local result="-name ${patterns[0]}"
  for pattern in "${patterns[@]:1}"; do
    result+=" -o -name ${pattern}"
  done
  echo "${result}"
}

function check() {
  local patterns=("$@")
  buildPattern=$(buildPatternList "${patterns[@]}")
  buildExcludeDir=$(buildExcludeDirectories)
  if find . -type f '(' ${buildPattern} ')' ${buildExcludeDir} -exec grep -H -E -o -c "The Perses Authors" {} \; | grep 0; then
    echo "the files above don't contain the license header."
    exit 1
  else
    exit 0
  fi
}

function add_license() {
  local patterns=("$@")
  buildPattern=$(buildPatternList "${patterns[@]}")
  buildExcludeDir=$(buildExcludeDirectories)
}

if [[ "$1" == "--check" ]]; then
  check "${@:2}"
fi
