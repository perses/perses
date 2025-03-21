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

package group

import (
	"strings"
	varBuilder "github.com/perses/perses/cue/dac-utils/variable"
)

// The Variable Group builder takes care of generating a pattern that we often see in dashboards:
// when you have e.g 3 variables A, B and C, it's quite common to "bind" them together so that B
// depends on A, and C depends on B + A.
// Parameters:
// - (Mandatory) `#input`:          The list of variables to be "grouped".
// - (Optional)  `#datasourceName`: Datasource to be used for all the variables of this group. Avoids the necessity to provide
//                                  the datasource name for each variable when you want to use the same for all.
//                                  /!\ variable plugins should rely on the same `#datasourceName` identifier for this to work.
// Outputs:
// - `variables`:   The final list of variables objects, ready to be passed to the dashboard.
// - `queryParams`: A query string including all variables from the group, to be used in urls.

#input: [...varBuilder]

_datasourceName=#datasourceName?: string

#input: [for i, _ in #input {
	// For each variable, append previous variables as "dependencies" for it.
	// E.g considering 3 variables: cluster>namespace>pod, with each one depending
	// on the previous ones, the generated dependencies would be:
	// - cluster:   []
	// - namespace: [cluster]
	// - pod:       [cluster, namespace]
	// this dependencies information can be used later to generate the right filter(s)
	#dependencies: [for i2, var in #input if i > i2 {var}]
	if _datasourceName != _|_  {
		#datasourceName: _datasourceName
	}
}]

variables: [for i in #input {i.variable}]

// generate a query param string to be used in urls
_varNames: [for v in variables {"var-\(v.spec.name)=$\(v.spec.name)"}]
queryParams: strings.Join(_varNames, "&")
