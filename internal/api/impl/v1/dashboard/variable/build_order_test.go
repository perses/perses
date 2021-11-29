// Copyright 2021 The Perses Authors
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
	"testing"

	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/stretchr/testify/assert"
)

func TestBuildVariableDependencies(t *testing.T) {
	testSuite := []struct {
		title     string
		variables map[string]*dashboard.Variable
		result    map[string][]string
	}{
		{
			title:     "no variable, not dep",
			variables: nil,
			result:    map[string][]string{},
		},
		{
			title: "constant variable, no dep",
			variables: map[string]*dashboard.Variable{
				"myVariable": {
					Kind: dashboard.KindConstantVariable,
					Parameter: &dashboard.ConstantVariableParameter{
						Values: []string{"myConstant"},
					},
				},
			},
			result: map[string][]string{},
		},
		{
			title: "query variable with no variable used",
			variables: map[string]*dashboard.Variable{
				"myVariable": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "vector(1)",
					},
				},
			},
			result: map[string][]string{},
		},
		{
			title: "query variable with variable used",
			variables: map[string]*dashboard.Variable{
				"myVariable": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "sum by($doe) (rate($foo{label='$bar'}))",
					},
				},
				"foo": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "test",
					},
				},
				"bar": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "vector($foo)",
					},
				},
				"doe": {
					Kind: dashboard.KindConstantVariable,
					Parameter: &dashboard.ConstantVariableParameter{
						Values: []string{"myConstant"},
					},
				},
			},
			result: map[string][]string{
				"myVariable": {
					"doe", "foo", "bar",
				},
				"bar": {
					"foo",
				},
			},
		},
		{
			title: "query variable label_values with variable used",
			variables: map[string]*dashboard.Variable{
				"myVariable": {
					Kind: dashboard.KindLabelValuesQueryVariable,
					Parameter: &dashboard.LabelValuesQueryVariableParameter{
						LabelName: "$foo",
						Matchers:  []string{"$foo{$bar='test'}"},
					},
				},
				"foo": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "test",
					},
				},
				"bar": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "vector($foo)",
					},
				},
				"doe": {
					Kind: dashboard.KindConstantVariable,
					Parameter: &dashboard.ConstantVariableParameter{
						Values: []string{"myConstant"},
					},
				},
			},
			result: map[string][]string{
				"myVariable": {
					"foo", "bar",
				},
				"bar": {
					"foo",
				},
			},
		},
		{
			title: "query variable label_names with variable used",
			variables: map[string]*dashboard.Variable{
				"myVariable": {
					Kind: dashboard.KindLabelNamesQueryVariable,
					Parameter: &dashboard.LabelNamesQueryVariableParameter{
						Matchers: []string{"$foo{$bar='test'}"},
					},
				},
				"foo": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "test",
					},
				},
				"bar": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "vector($foo)",
					},
				},
				"doe": {
					Kind: dashboard.KindConstantVariable,
					Parameter: &dashboard.ConstantVariableParameter{
						Values: []string{"myConstant"},
					},
				},
			},
			result: map[string][]string{
				"myVariable": {
					"foo", "bar",
				},
				"bar": {
					"foo",
				},
			},
		},
		{
			title: "multiple usage of the same variable",
			variables: map[string]*dashboard.Variable{
				"myVariable": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "sum by($doe, $bar) (rate($foo{label='$bar'}))",
					},
				},
				"foo": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "test",
					},
				},
				"bar": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "vector($foo)",
					},
				},
				"doe": {
					Kind: dashboard.KindConstantVariable,
					Parameter: &dashboard.ConstantVariableParameter{
						Values: []string{"myConstant"},
					},
				},
			},
			result: map[string][]string{
				"myVariable": {
					"doe", "bar", "foo",
				},
				"bar": {
					"foo",
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result, err := buildVariableDependencies(test.variables)
			assert.NoError(t, err)
			assert.Equal(t, len(test.result), len(result))
			for k, v := range test.result {
				assert.ElementsMatch(t, v, result[k])
			}
		})
	}
}

func TestBuildVariableDependenciesError(t *testing.T) {
	testSuite := []struct {
		title     string
		variables map[string]*dashboard.Variable
		err       error
	}{
		{
			title: "wrong variable name",
			variables: map[string]*dashboard.Variable{
				"VariableW$thI%ValidChar": {
					Kind:      dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{},
				},
			},
			err: fmt.Errorf("%q is not a correct variable name. It should match the regexp: %s", "VariableW$thI%ValidChar", variableRegexp.String()),
		},
		{
			title: "variable used but not defined",
			variables: map[string]*dashboard.Variable{
				"myVariable": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "$foo",
					},
				},
			},
			err: fmt.Errorf("variable %q is used in the variable %q but not defined", "foo", "myVariable"),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			_, err := buildVariableDependencies(test.variables)
			assert.Equal(t, test.err, err)
		})
	}
}

func TestGraph_BuildOrder(t *testing.T) {
	testSuite := []struct {
		title        string
		variables    []string
		dependencies map[string][]string
		result       []Group
	}{
		{
			title:     "single variable",
			variables: []string{"myVariable"},
			result:    []Group{{Variables: []string{"myVariable"}}},
		},
		{
			title:     "independent variable",
			variables: []string{"a", "d", "e"},
			result:    []Group{{Variables: []string{"a", "d", "e"}}},
		},
		{
			title:     "a depend on d depend on e",
			variables: []string{"a", "d", "e"},
			dependencies: map[string][]string{
				"a": {"d"},
				"d": {"e"},
			},
			result: []Group{
				{Variables: []string{"e"}},
				{Variables: []string{"d"}},
				{Variables: []string{"a"}},
			},
		},
		{
			title:     "complete dep graph",
			variables: []string{"f", "d", "c", "b", "g", "a", "h", "e"},
			dependencies: map[string][]string{
				"e": {"a", "b"},
				"a": {"c", "f", "b"},
				"h": {"b"},
				"g": {"d"},
				"c": {"f"},
				"b": {"f"},
			},
			result: []Group{
				{Variables: []string{"f", "d"}},
				{Variables: []string{"c", "b", "g"}},
				{Variables: []string{"a", "h"}},
				{Variables: []string{"e"}},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			g := newGraph(test.variables, test.dependencies)
			result, err := g.buildOrder()
			assert.NoError(t, err)
			assert.Equal(t, len(test.result), len(result))
			for i := 0; i < len(result); i++ {
				assert.ElementsMatch(t, test.result[i].Variables, result[i].Variables)
			}
		})
	}
}

func TestGraph_BuildOrderError(t *testing.T) {
	testSuite := []struct {
		title        string
		variables    []string
		dependencies map[string][]string
	}{
		{
			title:     "simple circular dep",
			variables: []string{"a", "b"},
			dependencies: map[string][]string{
				"a": {"b"},
				"b": {"a"},
			},
		},
		{
			title:     "circular dep on the same node",
			variables: []string{"a"},
			dependencies: map[string][]string{
				"a": {"a"},
			},
		},
		{
			title:     "circular dep with transition",
			variables: []string{"f", "d", "c", "b", "g", "a", "h", "e"},
			dependencies: map[string][]string{
				"e": {"a", "b"},
				"a": {"c", "f", "b"},
				"h": {"b"},
				"g": {"d", "c"},
				"c": {"f"},
				"b": {"f"},
				"d": {"d"},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			g := newGraph(test.variables, test.dependencies)
			_, err := g.buildOrder()
			assert.Equal(t, fmt.Errorf("circular dependency detected"), err)
		})
	}
}

func TestBuildOrder(t *testing.T) {
	testSuite := []struct {
		title     string
		variables map[string]*dashboard.Variable
		result    []Group
	}{
		{
			title: "no variable",
		},
		{
			title: "constant variable, no dep",
			variables: map[string]*dashboard.Variable{
				"myVariable": {
					Kind: dashboard.KindConstantVariable,
					Parameter: &dashboard.ConstantVariableParameter{
						Values: []string{"myConstant"},
					},
				},
			},
			result: []Group{{Variables: []string{"myVariable"}}},
		},
		{
			title: "multiple usage of same variable",
			variables: map[string]*dashboard.Variable{
				"myVariable": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "sum by($doe, $bar) (rate($foo{label='$bar'}))",
					},
				},
				"foo": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "test",
					},
				},
				"bar": {
					Kind: dashboard.KindPromQLQueryVariable,
					Parameter: &dashboard.PromQLQueryVariableParameter{
						Expr: "vector($foo)",
					},
				},
				"doe": {
					Kind: dashboard.KindConstantVariable,
					Parameter: &dashboard.ConstantVariableParameter{
						Values: []string{"myConstant"},
					},
				},
			},
			result: []Group{
				{Variables: []string{"doe", "foo"}},
				{Variables: []string{"bar"}},
				{Variables: []string{"myVariable"}},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			groups, err := BuildOrder(test.variables)
			assert.NoError(t, err)
			assert.Equal(t, len(test.result), len(groups))
			for i := 0; i < len(groups); i++ {
				assert.ElementsMatch(t, test.result[i].Variables, groups[i].Variables)
			}
		})
	}
}
