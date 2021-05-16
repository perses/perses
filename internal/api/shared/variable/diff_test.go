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

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCalculationStartAt(t *testing.T) {
	testSuite := []struct {
		title                        string
		current                      map[string]string
		previous                     map[string]string
		groups                       []Group
		groupNumber                  int
		needToRecalculateAllVariable bool
	}{
		{
			title: "no current or previous",
			groups: []Group{
				{
					Variables: []string{
						"a",
					},
				},
				{
					Variables: []string{
						"b",
					},
				},
			},
			groupNumber:                  0,
			needToRecalculateAllVariable: false,
		},
		{
			title: "same map contained all variable",
			current: map[string]string{
				"a": "value",
				"b": "otherValue",
			},
			previous: map[string]string{
				"a": "value",
				"b": "otherValue",
			},
			groups: []Group{
				{
					Variables: []string{
						"a",
					},
				},
				{
					Variables: []string{
						"b",
					},
				},
			},
			groupNumber:                  2,
			needToRecalculateAllVariable: false,
		},
		{
			title: "same map missed the last variable",
			current: map[string]string{
				"a": "value",
				"b": "otherValue",
			},
			previous: map[string]string{
				"a": "value",
				"b": "otherValue",
			},
			groups: []Group{
				{
					Variables: []string{
						"a",
					},
				},
				{
					Variables: []string{
						"b",
					},
				},
				{
					Variables: []string{
						"c",
					},
				},
			},
			groupNumber:                  2,
			needToRecalculateAllVariable: false,
		},
		{
			title: "map missed a variable in a group",
			current: map[string]string{
				"a": "value",
				"b": "otherValue",
				"d": "valueThatDependsOnBOrC",
			},
			previous: map[string]string{
				"a": "value",
				"b": "otherValue",
				"d": "valueThatDependsOnBOrC",
			},
			groups: []Group{
				{
					Variables: []string{
						"a",
					},
				},
				{
					Variables: []string{
						"b",
						"c",
					},
				},
				{
					Variables: []string{
						"d",
					},
				},
			},
			groupNumber:                  1,
			needToRecalculateAllVariable: false,
		},
		{
			title: "map with one diff",
			current: map[string]string{
				"a": "value",
				"b": "otherValue",
			},
			previous: map[string]string{
				"a": "value",
				"b": "differentValue",
			},
			groups: []Group{
				{
					Variables: []string{
						"a",
					},
				},
				{
					Variables: []string{
						"b",
					},
				},
				{
					Variables: []string{
						"c",
					},
				},
			},
			groupNumber:                  2,
			needToRecalculateAllVariable: true,
		},
		{
			title: "map with one diff and group with multiple variable",
			current: map[string]string{
				"a": "value",
				"b": "otherValue",
				"c": "who cares",
				"d": "valueThatDependsOnBOrC",
			},
			previous: map[string]string{
				"a": "value",
				"b": "otherValue",
				"c": "me",
				"d": "valueThatDependsOnBOrC",
			},
			groups: []Group{
				{
					Variables: []string{
						"a",
					},
				},
				{
					Variables: []string{
						"b",
						"c",
					},
				},
				{
					Variables: []string{
						"d",
					},
				},
			},
			groupNumber:                  2,
			needToRecalculateAllVariable: true,
		},
		{
			title: "map with multiple diff and missing value and group with multiple variable",
			current: map[string]string{
				"a": "value",
				"b": "otherValue",
				"c": "who cares",
				"d": "v",
				"e": "v",
			},
			previous: map[string]string{
				"a": "value",
				"b": "otherValue",
				"c": "me",
				"d": "v",
				"e": "v",
			},
			groups: []Group{
				{
					Variables: []string{
						"a",
					},
				},
				{
					Variables: []string{
						"b",
						"c",
						"d",
						"e",
						"f",
					},
				},
				{
					Variables: []string{
						"g",
					},
				},
			},
			groupNumber:                  1,
			needToRecalculateAllVariable: false,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			groupNumber, needToRecalculate := CalculationStartAt(test.current, test.previous, test.groups)
			assert.Equal(t, test.groupNumber, groupNumber)
			assert.Equal(t, test.needToRecalculateAllVariable, needToRecalculate)
		})
	}
}
