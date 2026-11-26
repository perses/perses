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

package grafana

import (
	"fmt"
	"strconv"
	"strings"
)

// ReplaceInputValue replaces the placeholders of the inputs of a Grafana dashboard exported for sharing externally,
// e.g. ${DS_PROMETHEUS} or $DS_PROMETHEUS, by the values given for these inputs.
func ReplaceInputValue(input map[string]string, grafanaDashboard string) string {
	result := grafanaDashboard
	for key, value := range input {
		// Escape special characters that may be present in the value
		escapedValue := strconv.Quote(value)
		// Remove the extra surrounding quotes added by strconv.Quote
		escapedValue = escapedValue[1 : len(escapedValue)-1]
		// Do the replacement (2 syntaxes to support)
		result = strings.ReplaceAll(result, fmt.Sprintf("$%s", key), escapedValue)
		result = strings.ReplaceAll(result, fmt.Sprintf("${%s}", key), escapedValue)
	}
	return result
}
