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

package list

import (
	v1Dashboard "github.com/perses/perses/cuelang/model/api/v1/dashboard"
	v1Variable "github.com/perses/perses/cuelang/model/api/v1/variable"
	varBuilder "github.com/perses/perses/cuelang/dac-utils/variable"
)

// include the definitions of varBuilder at the root
varBuilder

#name: _ // this is needed for below reference

#display?: _ // this is needed for below reference

// specify the constraints for this variable
#kind:             v1Variable.#KindList
#allowAllValue:    bool | *false
#allowMultiple:    bool | *false
#customAllValue?:  string
#capturingRegexp?: string
#sort?:            v1Variable.#Sort
#pluginKind:       string
#datasourceName:   string

variable: v1Dashboard.#Variable & {
	kind: #kind
	spec: {
		v1Dashboard.#ListVariableSpec & {
			name: #name
			if #display != _|_ {
				display: #display
			}
			allowAllValue: #allowAllValue
			allowMultiple: #allowMultiple
			if #customAllValue != _|_ {
				customAllValue: #customAllValue
			}
			if #capturingRegexp != _|_ {
				capturingRegexp: #capturingRegexp
			}
			if #sort != _|_ {
				sort: #sort
			}
			plugin: {
				kind: #pluginKind
			}
		}
	}
}
