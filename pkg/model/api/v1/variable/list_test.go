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
	"testing"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/stretchr/testify/assert"
)

func TestListSpec_Validate(t *testing.T) {
	testSuite := []struct {
		title       string
		spec        *ListSpec
		expectError bool
		errorMsg    string
		// For testing the conversion, we'll check the state after validation
		expectedSingleValue string
		expectedSliceValues []string
	}{
		{
			title: "valid spec with single default value",
			spec: &ListSpec{
				DefaultValue: &DefaultValue{
					SingleValue: "value1",
				},
				AllowMultiple: false,
				Plugin: common.Plugin{
					Kind: "TestPlugin",
				},
			},
			expectError:         false,
			expectedSingleValue: "value1",
			expectedSliceValues: nil,
		},
		{
			title: "valid spec with slice default value and allowMultiple true",
			spec: &ListSpec{
				DefaultValue: &DefaultValue{
					SliceValues: []string{"value1", "value2"},
				},
				AllowMultiple: true,
				Plugin: common.Plugin{
					Kind: "TestPlugin",
				},
			},
			expectError:         false,
			expectedSingleValue: "",
			expectedSliceValues: []string{"value1", "value2"},
		},
		{
			title: "conversion: slice with single value to single value when allowMultiple false",
			spec: &ListSpec{
				DefaultValue: &DefaultValue{
					SliceValues: []string{"single_value"},
				},
				AllowMultiple: false,
				Plugin: common.Plugin{
					Kind: "TestPlugin",
				},
			},
			expectError:         false,
			expectedSingleValue: "single_value",
			expectedSliceValues: nil,
		},
		{
			title: "error: slice with multiple values when allowMultiple false",
			spec: &ListSpec{
				DefaultValue: &DefaultValue{
					SliceValues: []string{"value1", "value2"},
				},
				AllowMultiple: false,
				Plugin: common.Plugin{
					Kind: "TestPlugin",
				},
			},
			expectError: true,
			errorMsg:    "you can not use a list of default values if allowMultiple is set to false",
		},
		{
			title: "error: customAllValue set but allowAllValue false",
			spec: &ListSpec{
				CustomAllValue: "custom_all",
				AllowAllValue:  false,
				Plugin: common.Plugin{
					Kind: "TestPlugin",
				},
			},
			expectError: true,
			errorMsg:    "customAllValue cannot be set if allowAllValue is not set to true",
		},
		{
			title: "valid spec with customAllValue and allowAllValue true",
			spec: &ListSpec{
				CustomAllValue: "custom_all",
				AllowAllValue:  true,
				Plugin: common.Plugin{
					Kind: "TestPlugin",
				},
			},
			expectError: false,
		},
		{
			title: "valid spec with no default value",
			spec: &ListSpec{
				AllowMultiple: true,
				Plugin: common.Plugin{
					Kind: "TestPlugin",
				},
			},
			expectError: false,
		},
		{
			title: "conversion: empty slice should not cause conversion",
			spec: &ListSpec{
				DefaultValue: &DefaultValue{
					SliceValues: []string{},
				},
				AllowMultiple: false,
				Plugin: common.Plugin{
					Kind: "TestPlugin",
				},
			},
			expectError:         false,
			expectedSingleValue: "",
			expectedSliceValues: []string{},
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			err := test.spec.Validate()

			if test.expectError {
				assert.Error(t, err)
				if test.errorMsg != "" {
					assert.Contains(t, err.Error(), test.errorMsg)
				}
			} else {
				assert.NoError(t, err)

				// Check the conversion results if specified
				if test.expectedSingleValue != "" || test.expectedSliceValues != nil {
					if test.spec.DefaultValue != nil {
						assert.Equal(t, test.expectedSingleValue, test.spec.DefaultValue.SingleValue)
						assert.Equal(t, test.expectedSliceValues, test.spec.DefaultValue.SliceValues)
					}
				}
			}
		})
	}
}
