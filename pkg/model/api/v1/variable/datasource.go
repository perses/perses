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

package variable

import (
	"fmt"
)

type DatasourceSpec struct {
	Display *Display `json:"display,omitempty" yaml:"display,omitempty"`
	// Value from the list to be selected by default.
	DefaultValue *DefaultValue `json:"defaultValue,omitempty" yaml:"defaultValue,omitempty"`
	// CapturingRegexp is the regexp used to catch and filter the list of datasources.
	// If empty, then nothing is filtered. That's the equivalent of setting CapturingRegexp with (.*)
	CapturingRegexp string `json:"capturingRegexp,omitempty" yaml:"capturingRegexp,omitempty"`
	// Sort method to apply when rendering the list of datasources
	Sort *Sort `json:"sort,omitempty" yaml:"sort,omitempty"`
	// DatasourceKind is the kind of datasource to consider
	DatasourceKind string `json:"datasourceKind" yaml:"datasourceKind"`
}

func (v *DatasourceSpec) Validate() error {
	if len(v.DatasourceKind) == 0 {
		return fmt.Errorf("datasourceKind cannot be empty")
	}
	return nil
}
