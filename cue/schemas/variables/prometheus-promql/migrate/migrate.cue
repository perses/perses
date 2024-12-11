// Copyright 2024 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package migrate

import (
	"regexp"
)

#var: _

// NB we would need `if` to support short-circuit in order to avoid code duplication here.
//    See https://github.com/cue-lang/cue/issues/2232
if #var.type == "query" if (#var.query & string) != _|_ if #var.query =~ "^query_result" {
	kind: "PrometheusPromQLVariable"
	spec: {
		#qResRegexp: "^query_result\\((.*by\\s*\\((\\w+).*)\\)$"
		if #var.query =~ #qResRegexp {
			expr:      regexp.FindSubmatch(#qResRegexp, #var.query)[1]
			labelName: regexp.FindSubmatch(#qResRegexp, #var.query)[2]
		}
		if #var.query !~ #qResRegexp {
			expr:      #var.query
			labelName: "migration_from_grafana_not_supported"
		}
	}
}
if #var.type == "query" if (#var.query & {}) != _|_ if #var.query.query =~ "^query_result" {
	kind: "PrometheusPromQLVariable"
	spec: {
		#qResRegexp: "^query_result\\((.*by\\s*\\((\\w+).*)\\)$"
		if #var.query.query =~ #qResRegexp {
			expr:      regexp.FindSubmatch(#qResRegexp, #var.query.query)[1]
			labelName: regexp.FindSubmatch(#qResRegexp, #var.query.query)[2]
		}
		if #var.query.query !~ #qResRegexp {
			expr:      #var.query.query
			labelName: "migration_from_grafana_not_supported"
		}
	}
}
