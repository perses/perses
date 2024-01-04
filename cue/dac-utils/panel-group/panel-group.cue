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

// This package offers an utility to build a simple, standard layout easily,
// without having to manipulate directly the {x,y,w,h} coordinates of each
// and every panel.

package panelGroup

import (
	"math"
	"github.com/perses/perses/cue/model/api/v1"
	v1Dashboard "github.com/perses/perses/cue/model/api/v1/dashboard"
)

// expected user inputs
#panels: [string]: v1.#Panel
#title:  string
#cols:   >0 & <=#gridCols
#height: number | *6

// intermediary compute
#gridCols: 24
#panelsAsList: [ for k, p in #panels {p, name: k}]
#width: math.Trunc(#gridCols / #cols)
#panelsX: [ for i, _ in #panelsAsList {
	#width * math.Round(math.Mod(i, #cols))
}]
#panelsY: [ for i, _ in #panelsAsList {
	#height * math.Trunc(i/#cols)
}]

// output: the final layout, in the format expected by the Perses dashboard.
v1Dashboard.#Layout & {
	spec: v1Dashboard.#GridLayoutSpec & {
		display: title: #title
		items: [ for i, panel in #panelsAsList {
			x:      #panelsX[i]
			y:      #panelsY[i]
			width:  #width
			height: #height
			content: {
				"$ref": "#/spec/panels/\(panel.name)"
			}
		}]
	}
}
