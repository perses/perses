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

package common

import (
	"fmt"
	"regexp"
)

var idRegexp = regexp.MustCompile("^[a-zA-Z0-9_.-]+$")
var keyMaxLength = 75
var maxDescriptionLength = 200

// ValidateID checks for forbidden items in substring used inside id
func ValidateID(name string) error {
	if len(name) == 0 {
		return fmt.Errorf("name cannot be empty")
	}

	if len(name) > keyMaxLength {
		return fmt.Errorf("cannot contain more than %d characters", keyMaxLength)
	}

	if !idRegexp.MatchString(name) {
		return fmt.Errorf("%q is not a correct name. It should match the regexp: %s", name, idRegexp.String())
	}

	return nil
}

// ValidateDescription checks for forbidden items in substring used inside description
func ValidateDescription(description string) error {
	if len(description) > maxDescriptionLength {
		return fmt.Errorf("description cannot contain more than %d characters", maxDescriptionLength)
	}

	if !idRegexp.MatchString(description) {
		return fmt.Errorf("%q is not a correct description. It should match the regexp: %s", description, idRegexp.String())
	}

	return nil
}
