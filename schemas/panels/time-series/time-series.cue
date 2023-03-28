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

package timeserie

import (
	"github.com/perses/perses/schemas/common"
)

#legend: {
	position: "Bottom" | "Right"
}

#visual: {
	line_width?:    number & >=0.25 & <=3
	area_opacity?:  number & >=0 & <=1
	show_points?:   "Auto" | "Always"
	point_radius?:  number & >=0 & <=6
	stack?:         "All" | "Percent" // TODO: Percent option is disabled until support is added
	connect_nulls?: bool
}

#y_axis: {
	show?:  bool
	label?: string
	unit?:  common.#unit
	min?:   number
	max?:   number
}

kind: "TimeSeriesChart"
spec: close({
	queries: [...#ts_query]
	legend?:     #legend
	y_axis?:     #y_axis
	thresholds?: common.#thresholds
	visual?:     #visual
})

#ts_query: _
