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
	"testing"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/variable"
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

func TestUnmarshalJSONVariable(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		result *Variable
	}{
		{
			title: "simple TextVariable",
			jason: `
{
  "kind": "TextVariable",
  "spec": {
    "name": "SimpleText",
    "value": "value"
  }
}
`,
			result: &Variable{
				Kind: variable.KindText,
				Spec: &TextVariableSpec{
					TextSpec: variable.TextSpec{
						Value: "value",
					},
					Name: "SimpleText",
				},
			},
		},
		{
			title: "query variable by label_names",
			jason: `
{
  "kind": "ListVariable",
  "spec": {
    "name": "MyList",
    "display": {
      "name": "my awesome variable"
    },
    "plugin": {
      "kind": "PrometheusLabelNamesVariable",
      "spec": {}
    }
  }
}
`,
			result: &Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: false,
						},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelNamesVariable",
							Spec: map[string]interface{}{},
						},
					},
					Name: "MyList",
				},
			},
		},
		{
			title: "query variable by label_names with matcher",
			jason: `
{
  "kind": "ListVariable",
  "spec": {
    "name": "MyList",
    "display": {
      "name": "my awesome variable"
    },
    "plugin": {
      "kind": "PrometheusLabelNamesVariable",
      "spec": {
        "matchers": [
          "up"
        ]
      }
    }
  }
}
`,
			result: &Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: false,
						},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelNamesVariable",
							Spec: map[string]interface{}{
								"matchers": []interface{}{"up"},
							},
						},
					},
					Name: "MyList",
				},
			},
		},
		{
			title: "query variable with label_values and matcher",
			jason: `
{
  "kind": "ListVariable",
  "spec": {
    "name": "MyList",
    "display": {
      "name": "my awesome variable",
      "hidden": true
    },
    "plugin": {
      "kind": "PrometheusLabelValuesVariable",
      "spec": {
        "label_name": "instance",
        "matchers": [
          "up"
        ]
      }
    }
  }
}
`,
			result: &Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: true,
						},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelValuesVariable",
							Spec: map[string]interface{}{
								"label_name": "instance",
								"matchers":   []interface{}{"up"},
							},
						},
					},
					Name: "MyList",
				},
			},
		},
		{
			title: "default value as a single string",
			jason: `
{
  "kind": "ListVariable",
  "spec": {
    "name": "MyList",
    "display": {
      "name": "my awesome variable"
    },
    "default_value": "default",
    "plugin": {
      "kind": "PrometheusLabelValuesVariable",
      "spec": {
        "label_name": "instance",
        "matchers": [
          "up"
        ]
      }
    }
  }
}
`,
			result: &Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: false,
						},
						DefaultValue: &variable.DefaultValue{SingleValue: "default"},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelValuesVariable",
							Spec: map[string]interface{}{
								"label_name": "instance",
								"matchers":   []interface{}{"up"},
							},
						},
					},
					Name: "MyList",
				},
			},
		},
		{
			title: "default list of values",
			jason: `
{
  "kind": "ListVariable",
  "spec": {
    "name": "MyList",
    "display": {
      "name": "my awesome variable"
    },
    "allow_multiple" : true,
    "default_value": ["default1", "default2"],
    "plugin": {
      "kind": "PrometheusLabelValuesVariable",
      "spec": {
        "label_name": "instance",
        "matchers": [
          "up"
        ]
      }
    }
  }
}
`,
			result: &Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: false,
						},
						AllowMultiple: true,
						DefaultValue:  &variable.DefaultValue{SliceValues: []string{"default1", "default2"}},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelValuesVariable",
							Spec: map[string]interface{}{
								"label_name": "instance",
								"matchers":   []interface{}{"up"},
							},
						},
					},
					Name: "MyList",
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

func TestUnmarshalYAMLVariable(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result *Variable
	}{
		{
			title: "simple TextVariable",
			yamele: `
kind: "TextVariable"
spec:
  name: "SimpleText"
  value: "value"
`,
			result: &Variable{
				Kind: variable.KindText,
				Spec: &TextVariableSpec{
					TextSpec: variable.TextSpec{
						Value: "value",
					},
					Name: "SimpleText",
				},
			},
		},
		{
			title: "query variable by label_names",
			yamele: `
kind: "ListVariable"
spec:
  name: "MyList"
  display:
    name: "my awesome variable"
  plugin:
    kind: "PrometheusLabelNamesVariable"
`,
			result: &Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: false,
						},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelNamesVariable",
						},
					},
					Name: "MyList",
				},
			},
		},
		{
			title: "query variable by label_names with matcher",
			yamele: `
kind: "ListVariable"
spec:
  name: "MyList"
  display:
    name: "my awesome variable"
  plugin:
    kind: "PrometheusLabelNamesVariable"
    spec:
      matchers:
        - "up"
`,
			result: &Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: false,
						},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelNamesVariable",
							Spec: map[interface{}]interface{}{
								"matchers": []interface{}{"up"},
							},
						},
					},
					Name: "MyList",
				},
			},
		},
		{
			title: "query variable with label_values and matcher",
			yamele: `
kind: "ListVariable"
spec:
  name: "MyList"
  display:
    name: "my awesome variable"
    hidden: true
  plugin:
    kind: "PrometheusLabelValuesVariable"
    spec:
      label_name: "instance"
      matchers:
        - "up"
`,
			result: &Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: true,
						},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelValuesVariable",
							Spec: map[interface{}]interface{}{
								"label_name": "instance",
								"matchers":   []interface{}{"up"},
							},
						},
					},
					Name: "MyList",
				},
			},
		},
		{
			title: "default value as a single string",
			yamele: `
kind: "ListVariable"
spec:
  name: "MyList"
  display:
    name: "my awesome variable"
  default_value: "default"
  plugin:
    kind: "PrometheusLabelValuesVariable"
    spec:
      label_name: "instance"
      matchers:
        - "up"
`,
			result: &Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: false,
						},
						DefaultValue: &variable.DefaultValue{SingleValue: "default"},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelValuesVariable",
							Spec: map[interface{}]interface{}{
								"label_name": "instance",
								"matchers":   []interface{}{"up"},
							},
						},
					},
					Name: "MyList",
				},
			},
		},
		{
			title: "default list of values",
			yamele: `
kind: "ListVariable"
spec:
  name: "MyList"
  display:
    name: "my awesome variable"
  allow_multiple: true
  default_value:
    - "default1"
    - "default2"
  plugin:
    kind: "PrometheusLabelValuesVariable"
    spec:
      label_name: "instance"
      matchers:
        - "up"
`,
			result: &Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: false,
						},
						AllowMultiple: true,
						DefaultValue:  &variable.DefaultValue{SliceValues: []string{"default1", "default2"}},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelValuesVariable",
							Spec: map[interface{}]interface{}{
								"label_name": "instance",
								"matchers":   []interface{}{"up"},
							},
						},
					},
					Name: "MyList",
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

func TestUnmarshalVariableError(t *testing.T) {
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
  "spec": "insane"
}
`,
			err: fmt.Errorf(`unknown variable.kind "Awkward" used`),
		},
		{
			title: "TextVariable with no name",
			jsone: `
{
  "kind": "TextVariable",
  "spec": {
  }
}
`,
			err: fmt.Errorf(`name cannot be empty`),
		},
		{
			title: "TextVariable with no values",
			jsone: `
{
  "kind": "TextVariable",
  "spec": {
    "name": "hogwarts"
  }
}
`,
			err: fmt.Errorf(`value for the text variable cannot be empty`),
		},
		{
			title: "ListVariable with no name",
			jsone: `
{
  "kind": "ListVariable",
  "spec": {
  }
}
`,
			err: fmt.Errorf(`name cannot be empty`),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := &Variable{}
			assert.Equal(t, test.err, json.Unmarshal([]byte(test.jsone), result))
		})
	}
}

func TestMarshalListVariable(t *testing.T) {
	testSuite := []struct {
		title    string
		variable Variable
		result   string
	}{
		{
			title: "simple TextVariable",
			variable: Variable{
				Kind: variable.KindText,
				Spec: &TextVariableSpec{
					TextSpec: variable.TextSpec{
						Value: "value",
					},
					Name: "SimpleText",
				},
			},
			result: `{
  "kind": "TextVariable",
  "spec": {
    "value": "value",
    "name": "SimpleText"
  }
}`,
		},
		{
			title: "query variable by label_names",
			variable: Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: false,
						},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelNamesVariable",
							Spec: map[string]interface{}{},
						},
					},
					Name: "MyList",
				},
			},
			result: `{
  "kind": "ListVariable",
  "spec": {
    "display": {
      "name": "my awesome variable",
      "hidden": false
    },
    "allow_all_value": false,
    "allow_multiple": false,
    "plugin": {
      "kind": "PrometheusLabelNamesVariable",
      "spec": {}
    },
    "name": "MyList"
  }
}`,
		},
		{
			title: "query variable by label_names with matcher",
			variable: Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: false,
						},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelNamesVariable",
							Spec: map[string]interface{}{
								"matchers": []interface{}{"up"},
							},
						},
					},
					Name: "MyList",
				},
			},
			result: `{
  "kind": "ListVariable",
  "spec": {
    "display": {
      "name": "my awesome variable",
      "hidden": false
    },
    "allow_all_value": false,
    "allow_multiple": false,
    "plugin": {
      "kind": "PrometheusLabelNamesVariable",
      "spec": {
        "matchers": [
          "up"
        ]
      }
    },
    "name": "MyList"
  }
}`,
		},
		{
			title: "query variable with label_values and matcher",
			variable: Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: false,
						},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelValuesVariable",
							Spec: map[string]interface{}{
								"label_name": "instance",
								"matchers":   []interface{}{"up"},
							},
						},
					},
					Name: "MyList",
				},
			},
			result: `{
  "kind": "ListVariable",
  "spec": {
    "display": {
      "name": "my awesome variable",
      "hidden": false
    },
    "allow_all_value": false,
    "allow_multiple": false,
    "plugin": {
      "kind": "PrometheusLabelValuesVariable",
      "spec": {
        "label_name": "instance",
        "matchers": [
          "up"
        ]
      }
    },
    "name": "MyList"
  }
}`,
		},
		{
			title: "default value as a single string",
			variable: Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: false,
						},
						DefaultValue: &variable.DefaultValue{SingleValue: "default"},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelValuesVariable",
							Spec: map[string]interface{}{
								"label_name": "instance",
								"matchers":   []interface{}{"up"},
							},
						},
					},
					Name: "MyList",
				},
			},
			result: `{
  "kind": "ListVariable",
  "spec": {
    "display": {
      "name": "my awesome variable",
      "hidden": false
    },
    "default_value": "default",
    "allow_all_value": false,
    "allow_multiple": false,
    "plugin": {
      "kind": "PrometheusLabelValuesVariable",
      "spec": {
        "label_name": "instance",
        "matchers": [
          "up"
        ]
      }
    },
    "name": "MyList"
  }
}`,
		},
		{
			title: "default list of values",
			variable: Variable{
				Kind: variable.KindList,
				Spec: &ListVariableSpec{
					ListSpec: variable.ListSpec{
						Display: &variable.Display{
							Name:   "my awesome variable",
							Hidden: false,
						},
						AllowMultiple: true,
						DefaultValue:  &variable.DefaultValue{SliceValues: []string{"default1", "default2"}},
						Plugin: common.Plugin{
							Kind: "PrometheusLabelValuesVariable",
							Spec: map[string]interface{}{
								"label_name": "instance",
								"matchers":   []interface{}{"up"},
							},
						},
					},
					Name: "MyList",
				},
			},
			result: `{
  "kind": "ListVariable",
  "spec": {
    "display": {
      "name": "my awesome variable",
      "hidden": false
    },
    "default_value": [
      "default1",
      "default2"
    ],
    "allow_all_value": false,
    "allow_multiple": true,
    "plugin": {
      "kind": "PrometheusLabelValuesVariable",
      "spec": {
        "label_name": "instance",
        "matchers": [
          "up"
        ]
      }
    },
    "name": "MyList"
  }
}`,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			data, err := json.MarshalIndent(test.variable, "", "  ")
			assert.NoError(t, err)
			assert.Equal(t, test.result, string(data))
		})
	}
}
