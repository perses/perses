// Copyright 2021 Amadeus s.a.s
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

package variable

// diff returns a new map that contains only the variable that the value changed between 'previous' and 'current'
func diff(current map[string]string, previous map[string]string) map[string]bool {
	result := make(map[string]bool)
	for currentName, currentValue := range current {
		if previousValue, ok := previous[currentName]; ok {
			if previousValue != currentValue {
				result[currentName] = true
			}
		}
	}
	return result
}
