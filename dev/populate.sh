#!/bin/bash

# Copyright 2021 Amadeus s.a.s
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

function getKindID() {
  kind=$1
  if [ "${kind}" = "PrometheusRule" ]; then
    echo "prometheusrules"
  fi
}


function insertProjectResourceData() {
  file=$1
  jq -c '.[]' ${file} | while read -r entity; do
      _jq() {
        echo ${entity} | jq -r ${1}
      }
      id="/"$(getKindID $(_jq '.kind'))"/"$(_jq '.metadata.project')"/"$(_jq '.metadata.name')
      echo "injected document at with the key $id"
      docker exec dev_etcd_1 etcdctl put "${id}" "${entity}"
  done
}


insertProjectResourceData ./prometheusrule.json
