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
	promQLVar "github.com/perses/perses/schemas/variables/prometheus-promql:model"
	promLabelValuesVar "github.com/perses/perses/schemas/variables/prometheus-label-values:model"
	promLabelNamesVar "github.com/perses/perses/schemas/variables/prometheus-label-names:model"
	varsBuilder "github.com/perses/perses/schemas/builder:vars"
)

// expected user input
input: #input
#input: [...#listInputItem | #textInputItem]
#listInputItem: {
	varsBuilder.#listInputItem
	name: string | *label // map name to label by default
	metric: string
	label: string
}
#textInputItem: {
	varsBuilder.#textInputItem
	name: string | *label // map name to label by default
	label: string
}

// This allows the lib users to not have to specify the main variable kind when it's a 
// ListVariable (redundant given TextVariable has no plugin).
input: [for var in input {
	if var.pluginKind != _|_ {
		kind: "ListVariable"
	}
}]

// outputs:

// - `filters` is a list of filters, in a "russian dolls" manner.
//   Its main purpose is to help build the list of expressions below, but it's also made available for external use.
//   NB: the term filter here means a list of label matchers (= the part between curly braces in a promQL expression, used to filter the timeseries).
filters: [for i, _ in input {
	strings.Join(
		[for i2, var in input if i2 < i if var.label != _|_ {
			"\(var.label)=\"$\(var.label)\""
		}],
		","
	)
}]

// - `fullFilter` is a filter that contains all the labels available
fullMatcher: strings.Join([for var in input if var.label != _|_ {"\(var.label)=\"$\(var.label)\""}], ",")

// - `exprs` is a list of promQL expressions.
//   Its main purpose is to help build the list of variables below, but it's also made available for external use.
exprs: [for i, var in input {
    [ // switch
        if var.pluginKind == "PrometheusPromQLVariable" {
            "group by (" + var.label + ") (" + var.metric + "{" + filters[i] + "})"
        },
        if var.pluginKind == "PrometheusLabelValuesVariable" || var.pluginKind == "PrometheusLabelNamesVariable" {
            var.metric + "{" + filters[i] + "}"
        },
    ][0]
}]

// - `variables` is the final list of variables, in the format expected by the Perses dashboard.
let alias = input
variables: {varsBuilder & { input: alias }}.variables & [ for i, var in input {
    spec: [ // switch
        if var.kind == "ListVariable" if var.pluginKind == "PrometheusPromQLVariable" {
            plugin: promQLVar & {
                spec: {
                    datasource: kind: "PrometheusDatasource"
                    expr: exprs[i]
                    labelName: var.label
                }
            }
        },
        if var.kind == "ListVariable" if var.pluginKind == "PrometheusLabelValuesVariable" {
            plugin: promLabelValuesVar & {
                spec: {
                    datasource: kind: "PrometheusDatasource"
                    labelName: var.label
                    matchers: [exprs[i]]
                }
            }
        },
        if var.kind == "ListVariable" if var.pluginKind == "PrometheusLabelNamesVariable" {
            plugin: promLabelNamesVar & {
                spec: {
                    datasource: kind: "PrometheusDatasource"
                    matchers: [exprs[i]]
                }
            }
        },
        {}
    ][0]
}]
