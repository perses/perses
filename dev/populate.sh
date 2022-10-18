#!/bin/bash

# Copyright 2021 The Perses Authors
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

docker_cmd=docker
container=dev_etcd_1
with_etcd=false
local_folder_db=local_db

function getKindID() {
  kind=$1
  if [ "${kind}" = "Project" ]; then
    echo "projects"
  elif [ "${kind}" = "GlobalDatasource" ]; then
    echo "globaldatasources"
  elif [ "${kind}" = "Datasource" ]; then
    echo "datasources"
  elif [ "${kind}" = "Dashboard" ]; then
    echo "dashboards"
  fi
}

function injectDataInETCD() {
  id=$1
  entity=$2
  MSYS_NO_PATHCONV=1 ${docker_cmd} exec ${container} etcdctl put "/${id}" "${entity}"
}

function injectDataInLocalFileDB() {
  id="${local_folder_db}/""$1"".json"
  entity=$2
  folder=$(dirname "${id}")

  mkdir -p "${folder}"
  echo "${entity}" >"$id"
}

function insertResourceData() {
  file=$1
  isProjectResource=$2

  jq -c '.[]' ${file} | while read -r entity; do
    _jq() {
      echo ${entity} | jq -r "${1}"
    }
    id=$(getKindID $(_jq '.kind'))"/"
    if [ "${isProjectResource}" ]; then
      id=${id}$(_jq '.metadata.project')"/"
    fi
    id=${id}$(_jq '.metadata.name')
    echo "injected document at with the key $id"
    if [[ "${with_etcd}" = true ]]; then
      injectDataInETCD "${id}" "${entity}"
    else
      injectDataInLocalFileDB "${id}" "${entity}"
    fi
  done
}

function injectAllData() {
  insertResourceData ./data/localdatasource.json true
  insertResourceData ./data/dashboard.json true
  insertResourceData ./data/project.json
  insertResourceData ./data/globaldatasource.json
}

if [[ "$1" == "--with-etcd" ]]; then
  with_etcd=true
  if podman -v; then
    echo "using podman instead of docker binary"
    docker_cmd=podman
  fi

  if [ "$(${docker_cmd} ps -a | grep -c dev-etcd-1)" -gt 0 ]; then
    container=dev-etcd-1
  fi
fi

injectAllData
