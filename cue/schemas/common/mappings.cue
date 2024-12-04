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

package common

import (
	"strings"
)

#valueCondition: {
	kind: "Value"
	spec: {
		value:  strings.MinRunes(1)
		result: #mappingResult
	}
}

#rangeCondition: {
	kind: "Range"
	spec: {
		from?:  number
		to?:    number
		result: #mappingResult
	}
}

#regexCondition: {
	kind: "Regex"
	spec: {
		pattern: strings.MinRunes(1)
		result:  #mappingResult
	}
}

#miscCondition: {
	kind: "Misc"
	spec: {
		value:  "empty" | "null" | "NaN" | "true" | "false"
		result: #mappingResult
	}
}

#mappingResult: {
	value:  string
	color?: =~"^#(?:[0-9a-fA-F]{3}){1,2}$"
}

#mappings: #valueCondition | #rangeCondition | #regexCondition | #miscCondition
