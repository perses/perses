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

package variable

import (
	"fmt"
)

type TextSpec struct {
	Display  *Display `json:"display,omitempty" yaml:"display,omitempty"`
	Value    string   `json:"value" yaml:"value"`
	Constant bool     `json:"constant,omitempty" yaml:"constant,omitempty"`
}

func (v *TextSpec) Validate() error {
	if len(v.Value) == 0 {
		return fmt.Errorf("value for the text variable cannot be empty")
	}
	return nil
}
