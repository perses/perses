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

package text

import (
	v1Dashboard "github.com/perses/perses/cue/model/api/v1/dashboard"
	varBuilder "github.com/perses/perses/cue/dac-utils/variable"
	v1Variable "github.com/perses/perses/cue/model/api/v1/variable"
)

#kind: varBuilder.#kind & "TextVariable"
#name: varBuilder.#name
#display?: v1Variable.#Display & {
	hidden: bool | *false
}
#value:    string
#constant: bool | *false

variable: v1Dashboard.#Variable & {
	kind: #kind
	spec: {
		v1Dashboard.#TextVariableSpec & {
			name: #name
			if #display != _|_ {
				display: #display
			}
			value:    #value
			constant: #constant
		}
	}
}
