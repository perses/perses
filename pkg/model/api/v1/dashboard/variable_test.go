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

package dashboard

import (
	"encoding/json"
	"fmt"
	"regexp"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

func TestUnmarshallJSONVariable(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		result *Variable
	}{
		{
			title: "simple ConstantVariable",
			jason: `
{
  "kind": "Constant",
  "displayed_name": "my awesome variable",
  "parameter": {
    "values": [
      "myVariable"
    ]
  }
}
`,
			result: &Variable{
				Kind:          KindConstantVariable,
				DisplayedName: "my awesome variable",
				Parameter: &ConstantVariableParameter{
					Values: []string{"myVariable"},
				},
			},
		},
		{
			title: "simple ConstantVariable hide",
			jason: `
{
  "kind": "Constant",
  "hide": true,
  "parameter": {
    "values": [
      "myVariable"
    ]
  }
}
`,
			result: &Variable{
				Kind: KindConstantVariable,
				Hide: true,
				Parameter: &ConstantVariableParameter{
					Values: []string{"myVariable"},
				},
			},
		},
		{
			title: "query variable by label_names",
			jason: `
{
  "kind": "LabelNamesQuery",
  "displayed_name": "my awesome variable",
  "parameter": {
    "capturing_regexp": ".*"
  }
}
`,
			result: &Variable{
				Kind:          KindLabelNamesQueryVariable,
				DisplayedName: "my awesome variable",
				Parameter: &LabelNamesQueryVariableParameter{
					CapturingRegexp: (*CapturingRegexp)(regexp.MustCompile(`.*`)),
				},
			},
		},
		{
			title: "query variable by label_names with matcher",
			jason: `
{
  "kind": "LabelNamesQuery",
  "displayed_name": "my awesome variable",
  "parameter": { 
    "matchers": [
      "up"
    ],
    "capturing_regexp": ".*"
  }
}
`,
			result: &Variable{
				Kind:          KindLabelNamesQueryVariable,
				DisplayedName: "my awesome variable",
				Parameter: &LabelNamesQueryVariableParameter{
					Matchers:        []string{"up"},
					CapturingRegexp: (*CapturingRegexp)(regexp.MustCompile(`.*`)),
				},
			},
		},
		{
			title: "query variable with label_values and matcher",
			jason: `
{
  "kind": "LabelValuesQuery",
  "displayed_name": "my awesome variable",
  "parameter": {
    "label_name": "instance",
    "matchers": [
      "up"
    ],
    "capturing_regexp": ".*"
  }
}
`,
			result: &Variable{
				Kind:          KindLabelValuesQueryVariable,
				DisplayedName: "my awesome variable",
				Parameter: &LabelValuesQueryVariableParameter{
					LabelName:       "instance",
					Matchers:        []string{"up"},
					CapturingRegexp: (*CapturingRegexp)(regexp.MustCompile(`.*`)),
				},
			},
		},
		{
			title: "query variable with expr",
			jason: `
{
  "kind": "PromQLQuery",
  "displayed_name": "my awesome variable",
  "parameter": {
    "expr": "up{instance='localhost:8080'}",
    "label_name": "instance",
    "capturing_regexp": ".*"
  }
}
`,
			result: &Variable{
				Kind:          KindPromQLQueryVariable,
				DisplayedName: "my awesome variable",
				Parameter: &PromQLQueryVariableParameter{
					Expr:            "up{instance='localhost:8080'}",
					LabelName:       "instance",
					CapturingRegexp: (*CapturingRegexp)(regexp.MustCompile(`.*`)),
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := &Variable{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshallYAMLVariable(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result *Variable
	}{
		{
			title: "simple ConstantVariable",
			yamele: `
kind: "Constant"
displayed_name: "my awesome variable"
parameter:
  values:
  - "myVariable"
`,
			result: &Variable{
				Kind:          KindConstantVariable,
				DisplayedName: "my awesome variable",
				Parameter: &ConstantVariableParameter{
					Values: []string{"myVariable"},
				},
			},
		},
		{
			title: "simple ConstantVariable hide",
			yamele: `
kind: "Constant"
hide: true
parameter:
  values:
  - "myVariable"
`,
			result: &Variable{
				Kind: KindConstantVariable,
				Hide: true,
				Parameter: &ConstantVariableParameter{
					Values: []string{"myVariable"},
				},
			},
		},
		{
			title: "query variable by label_names",
			yamele: `
kind: "LabelNamesQuery"
displayed_name: "my awesome variable"
parameter:
  capturing_regexp: ".*"
`,
			result: &Variable{
				Kind:          KindLabelNamesQueryVariable,
				DisplayedName: "my awesome variable",
				Parameter: &LabelNamesQueryVariableParameter{
					CapturingRegexp: (*CapturingRegexp)(regexp.MustCompile(`.*`)),
				},
			},
		},
		{
			title: "query variable by label_names with matcher",
			yamele: `
kind: "LabelNamesQuery"
displayed_name: "my awesome variable"
parameter:
  matchers:
  - "up"
  capturing_regexp: ".*"
`,
			result: &Variable{
				Kind:          KindLabelNamesQueryVariable,
				DisplayedName: "my awesome variable",
				Parameter: &LabelNamesQueryVariableParameter{
					Matchers:        []string{"up"},
					CapturingRegexp: (*CapturingRegexp)(regexp.MustCompile(`.*`)),
				},
			},
		},
		{
			title: "query variable with label_values and matcher",
			yamele: `
kind: "LabelValuesQuery"
displayed_name: "my awesome variable"
parameter:
  label_name: "instance"
  matchers:
  - "up"
  capturing_regexp: ".*"
`,
			result: &Variable{
				Kind:          KindLabelValuesQueryVariable,
				DisplayedName: "my awesome variable",
				Parameter: &LabelValuesQueryVariableParameter{
					LabelName:       "instance",
					Matchers:        []string{"up"},
					CapturingRegexp: (*CapturingRegexp)(regexp.MustCompile(`.*`)),
				},
			},
		},
		{
			title: "query variable with expr",
			yamele: `
kind: "PromQLQuery"
displayed_name: "my awesome variable"
parameter:
  expr: "up{instance='localhost:8080'}"
  label_name: "instance"
  capturing_regexp: ".*"
`,
			result: &Variable{
				Kind:          KindPromQLQueryVariable,
				DisplayedName: "my awesome variable",
				Parameter: &PromQLQueryVariableParameter{
					Expr:            "up{instance='localhost:8080'}",
					LabelName:       "instance",
					CapturingRegexp: (*CapturingRegexp)(regexp.MustCompile(`.*`)),
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := &Variable{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshallVariableError(t *testing.T) {
	testSuite := []struct {
		title string
		jsone string
		err   error
	}{
		{
			title: "unsupported variable kind",
			jsone: `
{
  "kind": "Awkward",
  "parameter": "insane"
}
`,
			err: fmt.Errorf("unknown variable.kind 'Awkward' used"),
		},
		{
			title: "no displayed name provided",
			jsone: `
{
  "kind": "Constant",
  "parameter": {}
}
`,
			err: fmt.Errorf("variable.displayed_name cannot be empty if the variable is not hidden"),
		},
		{
			title: "constant variable with no values",
			jsone: `
{
  "kind": "Constant",
  "hide": true,
  "parameter": {}
}
`,
			err: fmt.Errorf("parameter.values cannot be empty for a constant variable"),
		},
		{
			title: "label names query variable with no regexp",
			jsone: `
{
  "kind": "LabelNamesQuery",
  "hide": true,
  "parameter": {}
}
`,
			err: fmt.Errorf("'parameter.capturing_regexp' cannot be empty for a LabelNamesQuery"),
		},
		{
			title: "LabelValuesQuery variable with empty label_name",
			jsone: `
{
  "kind": "LabelValuesQuery",
  "hide": true,
  "parameter": {
    "capturing_regexp": ".*"
  }
}
`,
			err: fmt.Errorf("'parameter.label_name' cannot be empty for a LabelValuesQuery"),
		},
		{
			title: "LabelValuesQuery variable with empty regexp",
			jsone: `
{
  "kind": "LabelValuesQuery",
  "hide": true,
  "parameter": {
    "label_name": "test"
  }
}
`,
			err: fmt.Errorf("'parameter.capturing_regexp' cannot be empty for a LabelValuesQuery"),
		},
		{
			title: "PromQLQuery variable with empty expr",
			jsone: `
{
  "kind": "PromQLQuery",
  "hide": true,
  "parameter": {
  }
}
`,
			err: fmt.Errorf("parameter.expr cannot be empty for a PromQLQuery"),
		},
		{
			title: "PromQLQuery variable with empty label_name filter",
			jsone: `
{
  "kind": "PromQLQuery",
  "hide": true,
  "parameter": {
    "expr": "1"
  }
}
`,
			err: fmt.Errorf("parameter.label_name cannot be empty for a PromQLQuery"),
		},
		{
			title: "PromQLQuery variable with empty label_value regexp",
			jsone: `
{
  "kind": "PromQLQuery",
  "hide": true,
  "parameter": {
    "expr": "1",
    "label_name" :"test"
  }
}
`,
			err: fmt.Errorf("parameter.capturing_regexp cannot be empty for a PromQLQuery"),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := &Variable{}
			assert.Equal(t, test.err, json.Unmarshal([]byte(test.jsone), result))
		})
	}
}
