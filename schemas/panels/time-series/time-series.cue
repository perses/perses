// Copyright 2022 The Perses Authors
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
	position?: "bottom" | "right"
}

#visual: {
	line_width?:   number & >=0.5 & <=4
	point_radius?: number & >=0 & <=8
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
	unit?:       common.#unit
	thresholds?: common.#thresholds
	visual?:     #visual
})

#ts_query: _
