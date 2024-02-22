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

// This package offers an utility to build panel groups easily, without
// having to manipulate directly the {x,y,w,h} coordinates of each and
// every panel.
// /!\ It's recommended to not use this package directly but rather go
// through the `panelGroupsBuilder` package, that takes care of auto-feeding
// the `#groupIndex` parameter.

package panelGroup

import (
	"math"
	"github.com/perses/perses/cue/model/api/v1"
	v1Dashboard "github.com/perses/perses/cue/model/api/v1/dashboard"
)

// expected user inputs
#panels: [...v1.#Panel]
#title:      string
#groupIndex: number
#cols:       >0 & <=#gridCols
#height:     number | *6

// intermediary compute
#gridCols: 24
#width:    math.Trunc(#gridCols / #cols)
#panelsX: [for i, _ in #panels {
	#width * math.Round(math.Mod(i, #cols))
}]
#panelsY: [for i, _ in #panels {
	#height * math.Trunc(i/#cols)
}]

// output: the final layout & panels as map.
layout: v1Dashboard.#Layout & {
	spec: v1Dashboard.#GridLayoutSpec & {
		display: title: #title
		items: [for i, panel in #panels {
			x:      #panelsX[i]
			y:      #panelsY[i]
			width:  #width
			height: #height
			content: {
				"$ref": "#/spec/panels/\(#groupIndex)_\(i)"
			}
		}]
	}
}

panels: {for i, panel in #panels {
	"\(#groupIndex)_\(i)": panel
}}
