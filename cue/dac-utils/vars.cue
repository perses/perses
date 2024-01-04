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

// This package offers an utility to build variables easily.

package vars

import (
	v1Dashboard "github.com/perses/perses/cue/model/api/v1/dashboard"
)

// expected user input: a list of variables, in a simplified format
input: [...#listInputItem | #textInputItem]
#listInputItem: {
	kind:           "ListVariable"
	name:           string
	pluginKind:     string
	datasourceName: string
	allowAllValue:  bool | *false
	allowMultiple:  bool | *false
	...
}
#textInputItem: {
	kind:     "TextVariable"
	name:     string
	value:    string
	constant: bool | *false
	...
}

// output: `variables` as the final list of variables, in the format expected by the Perses dashboard.
variables: [...v1Dashboard.#Variable] & [ for id, var in input {
	kind: var.kind
	spec: [ // switch
		if var.kind == "ListVariable" {
			v1Dashboard.#ListVariableSpec & {
				name:          var.name
				allowAllValue: var.allowAllValue
				allowMultiple: var.allowMultiple
				plugin: {
					kind: var.pluginKind
					spec: {
						datasource: name: var.datasourceName
					}
				}
			}
		},
		if var.kind == "TextVariable" {
			v1Dashboard.#TextVariableSpec & {
				name:     var.name
				value:    var.value
				constant: var.constant
			}
		},
	][0]
}]
