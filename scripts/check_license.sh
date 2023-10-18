#!/bin/bash

set -e

exclude_directories=("*/node_modules/*" ".git/*" ".idea/*" ".github/*" ".circleci/*" "scripts/*" "*/dist/*" "*/storybook-static/*")
exclude_files=("migrate.cue")
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
  local result="-not -path \"${exclude_directories[0]}\""
  for dir in "${exclude_directories[@]:1}"; do
    result+=" -and -not -path \"${dir}\""
  done
  echo "${result}"
}

function buildExcludeFiles() {
  local result="-not -name \"${exclude_files[0]}\""
  for file in "${exclude_files[@]:1}"; do
    result+=" -and -not -name \"${file}\""
  done
  echo "${result}"
}

function buildPatternList() {
  local patterns=("$@")
  local result="-name \"${patterns[0]}\""
  for pattern in "${patterns[@]:1}"; do
    result+=" -o -name \"${pattern}\""
  done
  echo "${result}"
}

function findFilesWithMissingLicense(){
  local patterns=("$@")
  buildPattern=$(buildPatternList "${patterns[@]}")
  buildExcludeDir=$(buildExcludeDirectories)
  buildExcludeFiles=$(buildExcludeFiles)
  cmd="find . -type f \( ${buildPattern} \) -and \( ${buildExcludeDir} \) -and \( ${buildExcludeFiles} \) -exec grep -H -E -o -c \"${license_copyright}\" {} \; | grep ':0$'"
  eval $cmd
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
    echo "add license header in ${file}"
    echo -e "${license_header}\n\n$(cat "${file}")" > "${file}"
  done
}

if [[ "$1" == "--check" ]]; then
  check "${@:2}"
fi

if [[ $1 == "--add" ]]; then
  add "${@:2}"
fi
