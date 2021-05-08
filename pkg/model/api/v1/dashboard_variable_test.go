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

package v1

import (
	"encoding/json"
	"regexp"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

func TestUnmarshallJSONVariable(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		result *DashboardVariable
	}{
		{
			title: "simple ConstantVariable",
			jason: `
{
  "kind": "Constant",
  "parameter": {
    "values": [
      "myVariable"
    ]
  }
}
`,
			result: &DashboardVariable{
				Kind: KindConstantVariable,
				Parameter: &ConstantVariableParameter{
					Values: []string{"myVariable"},
				},
			},
		},
		{
			title: "query variable by label_names",
			jason: `
{
  "kind": "Query",
  "parameter": {
    "label_names": {},
    "capturing_regexp": ".*"
  }
}
`,
			result: &DashboardVariable{
				Kind: KindQueryVariable,
				Parameter: &QueryVariableParameter{
					LabelNames:      &QueryVariableLabelNames{},
					CapturingRegexp: regexp.MustCompile(`.*`),
				},
			},
		},
		{
			title: "query variable by label_names with matcher",
			jason: `
{
  "kind": "Query",
  "parameter": {
    "label_names": {
      "matchers": [
        "up"
      ]
    },
    "capturing_regexp": ".*"
  }
}
`,
			result: &DashboardVariable{
				Kind: KindQueryVariable,
				Parameter: &QueryVariableParameter{
					LabelNames: &QueryVariableLabelNames{
						Matchers: []string{"up"},
					},
					CapturingRegexp: regexp.MustCompile(`.*`),
				},
			},
		},
		{
			title: "query variable with label_values and matcher",
			jason: `
{
  "kind": "Query",
  "parameter": {
    "label_values": {
      "label_name": "instance",
      "matchers": [
        "up"
      ]
    },
    "capturing_regexp": ".*"
  }
}
`,
			result: &DashboardVariable{
				Kind: KindQueryVariable,
				Parameter: &QueryVariableParameter{
					LabelValues: &QueryVariableLabelValues{
						LabelName: "instance",
						Matchers:  []string{"up"},
					},
					CapturingRegexp: regexp.MustCompile(`.*`),
				},
			},
		},
		{
			title: "query variable with expr",
			jason: `
{
  "kind": "Query",
  "parameter": {
    "expr": "up{instance='localhost:8080'}",
    "capturing_regexp": ".*"
  }
}
`,
			result: &DashboardVariable{
				Kind: KindQueryVariable,
				Parameter: &QueryVariableParameter{
					Expr:            "up{instance='localhost:8080'}",
					CapturingRegexp: regexp.MustCompile(`.*`),
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := &DashboardVariable{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshallYAMLVariable(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result *DashboardVariable
	}{
		{
			title: "simple ConstantVariable",
			yamele: `
kind: "Constant"
parameter:
  values:
  - "myVariable"
`,
			result: &DashboardVariable{
				Kind: KindConstantVariable,
				Parameter: &ConstantVariableParameter{
					Values: []string{"myVariable"},
				},
			},
		},
		{
			title: "query variable by label_names",
			yamele: `
kind: "Query"
parameter:
  capturing_regexp: ".*"
  label_names: {}
`,
			result: &DashboardVariable{
				Kind: KindQueryVariable,
				Parameter: &QueryVariableParameter{
					LabelNames:      &QueryVariableLabelNames{},
					CapturingRegexp: regexp.MustCompile(`.*`),
				},
			},
		},
		{
			title: "query variable by label_names with matcher",
			yamele: `
kind: "Query"
parameter:
  label_names:
    matchers:
    - "up"
  capturing_regexp: ".*"
`,
			result: &DashboardVariable{
				Kind: KindQueryVariable,
				Parameter: &QueryVariableParameter{
					LabelNames: &QueryVariableLabelNames{
						Matchers: []string{"up"},
					},
					CapturingRegexp: regexp.MustCompile(`.*`),
				},
			},
		},
		{
			title: "query variable with label_values and matcher",
			yamele: `
kind: "Query"
parameter:
 label_values:
   label_name: "instance"
   matchers:
   - "up"
 capturing_regexp: ".*"
`,
			result: &DashboardVariable{
				Kind: KindQueryVariable,
				Parameter: &QueryVariableParameter{
					LabelValues: &QueryVariableLabelValues{
						LabelName: "instance",
						Matchers:  []string{"up"},
					},
					CapturingRegexp: regexp.MustCompile(`.*`),
				},
			},
		},
		{
			title: "query variable with expr",
			yamele: `
kind: "Query"
parameter:
  expr: "up{instance='localhost:8080'}"
  capturing_regexp: ".*"
`,
			result: &DashboardVariable{
				Kind: KindQueryVariable,
				Parameter: &QueryVariableParameter{
					Expr:            "up{instance='localhost:8080'}",
					CapturingRegexp: regexp.MustCompile(`.*`),
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := &DashboardVariable{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), result))
			assert.Equal(t, test.result, result)
		})
	}
}
