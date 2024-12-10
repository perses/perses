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

package model

import (
	"strings"
	"github.com/perses/perses/cue/schemas/common"
)

kind: "Table"
spec: close({
	density?:            "compact" | "standard" | "comfortable"
	defaultColumnWidth?: "auto" | number
	columnSettings?: [...#columnSettings]
	cellSettings?: [...#cellSettings]
	transforms?: [...common.#transform]
})

#columnSettings: {
	name:               strings.MinRunes(1)
	header?:            string
	headerDescription?: string
	cellDescription?:   string
	align?:             "left" | "center" | "right"
	enableSorting?:     bool
	sort?:              "asc" | "desc"
	width?:             number | "auto"
	hide?:              bool
}

#valueCondition: {
	kind: "Value"
	spec: {
		value: strings.MinRunes(1)
	}
}

#rangeCondition: {
	kind: "Range"
	spec: {
		min?: number
		max?: number
	}
}

#regexCondition: {
	kind: "Regex"
	spec: {
		expr: strings.MinRunes(1)
	}
}

#miscCondition: {
	kind: "Misc"
	spec: {
		value: "empty" | "null" | "NaN" | "true" | "false"
	}
}

#condition: {
	#valueCondition | #rangeCondition | #regexCondition | #miscCondition
}

#cellSettings: {
	condition:        #condition
	text?:            string
	textColor?:       =~"^#(?:[0-9a-fA-F]{3}){1,2}$"
	backgroundColor?: =~"^#(?:[0-9a-fA-F]{3}){1,2}$"
}
