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

package model

import (
	"github.com/perses/perses/cue/schemas/common"
)

#legendValue: common.#calculation

#legend: {
	position: "bottom" | "right"
	mode?:    "list" | "table"
	size?:    "small" | "medium"
	values?: [...#legendValue]
}

#palette: {
	mode: "auto" | "categorical"
}

#visual: {
	display?:      "line" | "bar"
	lineWidth?:    number & >=0.25 & <=3
	areaOpacity?:  number & >=0 & <=1
	showPoints?:   "auto" | "always"
	palette?:      #palette
	pointRadius?:  number & >=0 & <=6
	stack?:        "all" | "percent" // TODO: percent option is disabled until support is added
	connectNulls?: bool
}

kind: "PieChart"
spec: close({
	legend?:        #legend
	querySettings?: #querySettings
	calculation:    common.#calculation
	format?:        common.#format
	sort?:          "asc" | "desc"
	mode?:          "value" | "percentage"
	visual?:        #visual
	radius:         number
})

#querySettings: [...{
	queryIndex: int & >=0
	colorMode:  "fixed" | "fixed-single"       // NB: "palette" could be added later
	colorValue: =~"^#(?:[0-9a-fA-F]{3}){1,2}$" // hexadecimal color code
}]
