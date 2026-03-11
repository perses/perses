// Copyright The Perses Authors
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
	"github.com/perses/spec/cue/dashboard"
	dashboardVariable "github.com/perses/spec/cue/dashboard/variable"
	varBuilder "github.com/perses/perses/cue/dac-utils/variable"
)

// include the definitions of varBuilder at the root
varBuilder

#name: _ // this is needed for below reference

#display?: _ // this is needed for below reference

// specify the constraints for this variable
#kind:             dashboardVariable.#KindList
#allowAllValue:    bool | *false
#allowMultiple:    bool | *false
#customAllValue?:  string
#capturingRegexp?: string
#sort?:            dashboardVariable.#Sort
#pluginKind:       string

variable: {
	kind: #kind
	spec: {
		dashboard.#ListVariableSpec & {
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
