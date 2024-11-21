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

package promql

import (
	promQLVar "github.com/perses/perses/cue/schemas/variables/prometheus-promql:model"
	promVarBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variable"
	filterBuilder "github.com/perses/perses/cue/dac-utils/prometheus/filter"
)

// include the definitions of promVarBuilder at the root
promVarBuilder

#name: _ // this is needed for below reference

// specify the constraints for this variable
#pluginKind: promQLVar.kind
#metric:     string
#label:      string | *#name
#query:      string
#dependencies: [...{...}]

filter: {filterBuilder & {#input: #dependencies}}.filter

queryExpr: [// switch
	if #query != _|_ {#query},
	"group by (\(#label)) (\(#metric){\(filter)})",
][0]

variable: promVarBuilder.variable & {
	spec: {
		plugin: promQLVar & {
			spec: {
				expr:      queryExpr
				labelName: #label
			}
		}
	}
}
