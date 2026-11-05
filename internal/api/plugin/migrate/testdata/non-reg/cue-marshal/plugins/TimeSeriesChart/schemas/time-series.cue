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

package model

import (
	"github.com/perses/shared/cue/common"
)

kind: "TimeSeriesChart"
spec: close({
	legend?:        common.#legendWithValues
	tooltip?:       #tooltip
	yAxis?:         #yAxis
	thresholds?:    common.#thresholds
	visual?:        #visual
	querySettings?: #querySettings
})

#tooltip: {
	enablePinning?: bool
}

#palette: {
	mode: "auto" | "categorical"
}

#visual: {
	display?:      "line" | "bar"
	lineWidth?:    number & >=0.25 & <=3
	lineStyle?:    #lineStyle
	areaOpacity?:  #areaOpacity
	showPoints?:   "auto" | "always"
	palette?:      #palette
	pointRadius?:  number & >=0 & <=6
	stack?:        "all" | "percent" // TODO: percent option is disabled until support is added
	connectNulls?: bool
}

#yAxis: {
	show?:   bool
	label?:  string
	format?: common.#format
	min?:    number
	max?:    number
	if min != _|_ && max != _|_ {
		max: >=min
	}
	logBase?: 2 | 10
}

#querySettings: [...{
	queryIndex:   int & >=0
	colorMode?:   "fixed" | "fixed-single"       // NB: "palette" could be added later
	colorValue?:  =~"^#(?:[0-9a-fA-F]{3}){1,2}$" // hexadecimal color code
	lineStyle?:   #lineStyle
	areaOpacity?: #areaOpacity
	format?:      common.#format
	negativeY?:   bool // render the query's series below the X axis
	stack?:       bool
}]

#lineStyle: "solid" | "dashed" | "dotted"

#areaOpacity: number & >=0 & <=1 // transparency level from 0 (transparent) to 1 (opaque)
