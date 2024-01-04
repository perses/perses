// Copyright 2023 The Perses Authors
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

// This package offers an utility to build prometheus variables easily.
// It's a superset of the generic vars builder.

package prometheusVars

import (
	"strings"
	promQLVar "github.com/perses/perses/cue/schemas/variables/prometheus-promql:model"
	labelValuesVar "github.com/perses/perses/cue/schemas/variables/prometheus-label-values:model"
	labelNamesVar "github.com/perses/perses/cue/schemas/variables/prometheus-label-names:model"
	varsBuilder "github.com/perses/perses/cue/dac-utils:vars"
)

// expected user input: a list of variables, in a simplified format.
// /!\ Order matters! Each new variable will be "linked" to the previous ones, when applicable.
input: #input
#input: [...#promQLInputItem | #labelValuesInputItem | #labelNamesInputItem | #textInputItem]
#promQLInputItem: this=varsBuilder.#listInputItem & {
	pluginKind: promQLVar.kind
	metric:     string
	label:      string | *this.name
}
#labelValuesInputItem: this=varsBuilder.#listInputItem & {
	pluginKind: labelValuesVar.kind
	metric:     string
	label:      string | *this.name
}
#labelNamesInputItem: varsBuilder.#listInputItem & {
	pluginKind: labelNamesVar.kind
	metric:     string
}

#textInputItem: this=varsBuilder.#textInputItem & {
	pluginKind: this.kind // hack, dummy field to allow evaluations on pluginKind in all cases
	label:      string | *this.name
}

// outputs:

// - `filters` is a list of filters, in a "russian dolls" manner.
//   Its main purpose is to help build the list of expressions below, but it's also made available for external use.
//   NB: the term filter here means a list of label matchers (= the part between curly braces in a promQL expression, used to filter the timeseries).
filters: [ for i, _ in input {
	strings.Join(
	[ for i2, var in input if i2 < i if var.pluginKind != labelNamesVar.kind {
		"\(var.label)=\"$\(var.label)\""
	}],
	",",
	)
}]

// - `fullFilter` is a filter that contains all the labels available
fullFilter:
	strings.Join(
	[ for var in input if var.pluginKind != labelNamesVar.kind {
		"\(var.label)=\"$\(var.label)\""
	}],
	",",
	)

// - `exprs` is a list of promQL expressions.
//   Its main purpose is to help build the list of variables below, but it's also made available for external use.
exprs: [ for i, var in input {
	[ // switch
		if var.pluginKind == promQLVar.kind {
			"group by (" + var.label + ") (" + var.metric + "{" + filters[i] + "})"
		},
		var.metric + "{" + filters[i] + "}",
	][0]
}]

// - `variables` is the final list of variables, in the format expected by the Perses dashboard.
let alias = input
variables: {varsBuilder & {input: alias}}.variables & [ for i, var in input {
	spec: [ // switch
		if var.kind == "ListVariable" if var.pluginKind == promQLVar.kind {
			plugin: promQLVar & {
				spec: {
					datasource: kind: "PrometheusDatasource"
					expr:      exprs[i]
					labelName: var.label
				}
			}
		},
		if var.kind == "ListVariable" if var.pluginKind == labelValuesVar.kind {
			plugin: labelValuesVar & {
				spec: {
					datasource: kind: "PrometheusDatasource"
					labelName: var.label
					matchers: [exprs[i]]
				}
			}
		},
		if var.kind == "ListVariable" if var.pluginKind == labelNamesVar.kind {
			plugin: labelNamesVar & {
				spec: {
					datasource: kind: "PrometheusDatasource"
					matchers: [exprs[i]]
				}
			}
		},
		{},
	][0]
}]
