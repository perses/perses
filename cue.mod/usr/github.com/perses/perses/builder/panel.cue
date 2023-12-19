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

package panel

import (
	"strings"
	"github.com/perses/perses/pkg/model/api/v1"
)


// expected user inputs
#clause: "by" | "without" | *""
#clauseLabels: [...string] | *[]

// outputs:

// - `#aggr` is the final aggregation expression based on the provided clause & clause labels.
//   It can be used in your promQL expressions via string interpolation as follows: `sum \(#aggr) (up{job="prometheus"})`. 
#aggr: string | *""
if #clause != "" {
    #aggr: """
    \(#clause) (\(strings.Join(#clauseLabels, ",")))
    """
}

// - `#filter` is meant to be completed with a list of label matchers.
//   It could then be used in your promQL expressions via string interpolation as follows: `sum by (instance) (up{\(#filter)})`. 
#filter: string

// - the Perses panel datamodel is appended at the root
v1.#Panel
