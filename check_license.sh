#!/bin/bash

set -e

exclude_directories=("./ui/node_modules" ".git" ".idea" ".github")
year=$(date +'%Y')

license_copyright="The Perses Authors"
license_header="// Copyright ${year} ${license_copyright}
// Licensed under the Apache License, Version 2.0 (the \"License\");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an \"AS IS\" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License."

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

function findFilesWithMissingLicense(){
  local patterns=("$@")
  buildPattern=$(buildPatternList "${patterns[@]}")
  buildExcludeDir=$(buildExcludeDirectories)
  find . -type f '(' ${buildPattern} ')' ${buildExcludeDir} -exec grep -H -E -o -c "${license_copyright}" {} \; | grep ':0$'
}

function check() {
  if findFilesWithMissingLicense "$@"; then
    echo "The files above don't contain the license header."
    exit 1
  else
    echo "All necessary files contain the license header."
    exit 0
  fi
}

function add() {
  findFilesWithMissingLicense "$@" | sed 's/..$//'| while read -d $'\n' file
  do
    echo -e "${license_header}\n\n$(cat "${file}")" > "${file}"
  done
}

if [[ "$1" == "--check" ]]; then
  check "${@:2}"
fi

if [[ $1 == "--add" ]]; then
  add "${@:2}"
fi
