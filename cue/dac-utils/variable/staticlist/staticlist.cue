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

package staticlist

import (
	staticListVar "github.com/perses/perses/cue/schemas/variables/static-list:model"
	listVarBuilder "github.com/perses/perses/cue/dac-utils/variable/list"
	v1Variable "github.com/perses/perses/cue/model/api/v1/variable"
)

_kind=#kind: listVarBuilder.#kind & "ListVariable"
_name=#name: listVarBuilder.#name
_display=#display?: v1Variable.#Display & {
	hidden: bool | *false
}
_allowAllValue=#allowAllValue:      listVarBuilder.#allowAllValue
_allowMultiple=#allowMultiple:      listVarBuilder.#allowMultiple
_customAllValue=#customAllValue?:   string
_capturingRegexp=#capturingRegexp?: string
_sort=#sort?:                       v1Variable.#Sort
#pluginKind:                        listVarBuilder.#pluginKind & staticListVar.kind
#values: [...(string | {
	value:  string
	label?: string
})]

variable: {listVarBuilder & {#kind: _kind, #name: _name, #display: _display, #allowAllValue: _allowAllValue, #allowMultiple: _allowMultiple, #customAllValue: _customAllValue, #capturingRegexp: _capturingRegexp, #sort: _sort}}.variable & {
	spec: {
		plugin: staticListVar & {
			spec: {
				values: #values
			}
		}
	}
}
