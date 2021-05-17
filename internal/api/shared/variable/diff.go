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

// CalculationStartAt will determinate by comparing the two maps 'current' and 'previous'
// the group number the calculation of the variable need to start.
// It will also returned a boolean that will say if every variable in the group represented by the number returned
// need to be re-calculated.
// TODO (@nexucis) Actually the fact that a variable in the group 0 required to be recalculated doesn't necessary imply
//      that all next group should be recalculated.
//      For example in group 0 you can have a constant variable that user changed the selected value and none of the next group depends on it.
//      To solve this issue we need to have the dependency graph that contained the variable that changed.
//      Thanks to that, we will know exactly which variable must be recalculated
func CalculationStartAt(current map[string]string, previous map[string]string, groups []Group) (int, bool) {
	// Here we simply have to determinate which variables doesn't have the same value in 'current' comparing to 'previous'.
	// It's because the change of a value should trigger the calculation of every variable that depends of it.
	// It doesn't really matter if one variable is not set anymore in 'current'.
	diffMap := diff(current, previous)
	// now we just have to loop other the groups and find the first one
	// that is contained in diff or the first one that is not contained in 'current'.
	// If one variable is not contained in 'current' then it needs to be calculated.
	for i := 0; i < len(groups); i++ {
		diffDetected := false
		for _, name := range groups[i].Variables {
			// to avoid to hide a missing value in the current map
			// the fact that a diff has been detected in the current group would be used when leaving the loop.
			diffDetected = diffMap[name] || diffDetected
			if _, ok := current[name]; !ok {
				// current doesn't contain the value of the current variable.
				// So we have to calculate the variable contained in the current group
				return i, false
			}
		}
		if diffDetected {
			// calculation need to start for the next group and not the current one
			// because the next group would depend on the value of this one
			return i + 1, true
		}
	}
	// in case there is no diff and all variable are already set in 'current', then there is no variable to calculate.
	// So we can just returned the length of the groups.
	return len(groups), false
}
