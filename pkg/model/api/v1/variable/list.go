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
	"encoding/json"
	"fmt"

	"github.com/perses/perses/pkg/model/api/v1/common"
)

type DefaultValue struct {
	SingleValue string
	SliceValues []string
}

func (v *DefaultValue) UnmarshalJSON(data []byte) error {
	var s string
	var slice []string
	if unmarshalStringErr := json.Unmarshal(data, &s); unmarshalStringErr != nil {
		if unmarshalSliceErr := json.Unmarshal(data, &slice); unmarshalSliceErr != nil {
			return fmt.Errorf("unable to unmarshal defaultValue. Only string or array of string can be used")
		}
	}
	v.SingleValue = s
	v.SliceValues = slice
	return nil
}

func (v *DefaultValue) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var s string
	var slice []string
	if unmarshalStringErr := unmarshal(&s); unmarshalStringErr != nil {
		if unmarshalSliceErr := unmarshal(&slice); unmarshalSliceErr != nil {
			return fmt.Errorf("unable to unmarshal defaultValue. Only string or array of string can be used")
		}
	}
	v.SingleValue = s
	v.SliceValues = slice
	return nil
}

func (v *DefaultValue) MarshalJSON() ([]byte, error) {
	if len(v.SingleValue) > 0 {
		return json.Marshal(v.SingleValue)
	}
	return json.Marshal(v.SliceValues)
}

func (v *DefaultValue) MarshalYAML() (interface{}, error) {
	if len(v.SingleValue) > 0 {
		return v.SingleValue, nil
	}
	return v.SliceValues, nil
}

type Sort string

const (
	SortNone                            Sort = "none"
	SortAlphabeticalAsc                 Sort = "alphabetical-asc"
	SortAlphabeticalDesc                Sort = "alphabetical-desc"
	SortNumericalAsc                    Sort = "numerical-asc"
	SortNumericalDesc                   Sort = "numerical-desc"
	SortAlphabeticalCaseInsensitiveAsc  Sort = "alphabetical-ci-asc"
	SortAlphabeticalCaseInsensitiveDesc Sort = "alphabetical-ci-desc"
)

var SortMap = map[Sort]bool{
	SortNone:                            true,
	SortAlphabeticalAsc:                 true,
	SortAlphabeticalDesc:                true,
	SortNumericalAsc:                    true,
	SortNumericalDesc:                   true,
	SortAlphabeticalCaseInsensitiveAsc:  true,
	SortAlphabeticalCaseInsensitiveDesc: true,
}

func (s *Sort) UnmarshalJSON(data []byte) error {
	var tmp Sort
	type plain Sort
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

func (s *Sort) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Sort
	type plain Sort
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

func (s *Sort) validate() error {
	if len(*s) == 0 {
		return nil
	}
	if _, ok := SortMap[*s]; !ok {
		return fmt.Errorf("unknown sort method %q used", *s)
	}
	return nil
}

type ListSpec struct {
	Display *Display `json:"display,omitempty" yaml:"display,omitempty"`
	// Value from the list to be selected by default.
	DefaultValue *DefaultValue `json:"defaultValue,omitempty" yaml:"defaultValue,omitempty"`
	// Whether or not to append the "All" value that allows selecting all available values at once.
	AllowAllValue bool `json:"allowAllValue" yaml:"allowAllValue"`
	// Whether or not to allow multi-selection of values.
	AllowMultiple bool `json:"allowMultiple" yaml:"allowMultiple"`
	// CustomAllValue is a custom value that will be used if AllowAllValue is true and if then `all` is selected
	CustomAllValue string `json:"customAllValue,omitempty" yaml:"customAllValue,omitempty"`
	// CapturingRegexp is the regexp used to catch and filter the result of the query.
	// If empty, then nothing is filtered. That's the equivalent of setting CapturingRegexp with (.*)
	CapturingRegexp string `json:"capturingRegexp,omitempty" yaml:"capturingRegexp,omitempty"`
	// Sort method to apply when rendering the list of values
	Sort   *Sort         `json:"sort,omitempty" yaml:"sort,omitempty"`
	Plugin common.Plugin `json:"plugin" yaml:"plugin"`
}

func (v *ListSpec) Validate() error {
	if len(v.CustomAllValue) > 0 && !v.AllowAllValue {
		return fmt.Errorf("customAllValue cannot be set if allowAllValue is not set to true")
	}

	if v.DefaultValue != nil && len(v.DefaultValue.SliceValues) > 0 && !v.AllowMultiple {
		// If the default value list has only one element, convert it to a single value
		if len(v.DefaultValue.SliceValues) == 1 {
			v.DefaultValue.SingleValue = v.DefaultValue.SliceValues[0]
			v.DefaultValue.SliceValues = nil

			return nil
		}
		return fmt.Errorf("you can not use a list of default values if allowMultiple is set to false")
	}

	return nil
}
