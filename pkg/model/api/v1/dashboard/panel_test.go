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

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

func TestUnmarshalJSONPanel(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		result Panel
	}{
		{
			title: "line chart",
			jason: `
{
  "displayed_name": "simple line chart",
  "kind": "LineChart",
  "chart": {
    "lines": [
      {
        "expr": "up{instance='localhost:8080'}"
      }
    ]
  }
}
`,
			result: Panel{
				DisplayedName: "simple line chart",
				Kind:          KindLineChart,
				Chart: &LineChart{
					Lines: []Line{
						{
							Expr: "up{instance='localhost:8080'}",
						},
					},
				},
			},
		},
		{
			title: "gauge chart",
			jason: `
{
  "displayed_name": "simple gauge chart",
  "kind": "GaugeChart",
  "chart": {
    "expr": "up"
  }
}
`,
			result: Panel{
				DisplayedName: "simple gauge chart",
				Kind:          KindGaugeChart,
				Chart: &GaugeChart{
					Expr: "up",
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Panel{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshalYAMLPanel(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result Panel
	}{
		{
			title: "line chart",
			yamele: `
displayed_name: "simple line chart"
kind: "LineChart"
chart:
  lines:
  - expr: "up{instance='localhost:8080'}"
`,
			result: Panel{
				DisplayedName: "simple line chart",
				Kind:          KindLineChart,
				Chart: &LineChart{
					Lines: []Line{
						{
							Expr: "up{instance='localhost:8080'}",
						},
					},
				},
			},
		},
		{
			title: "gauge chart",
			yamele: `
displayed_name: "simple gauge chart"
kind: "GaugeChart"
chart:
  expr: "up"
`,
			result: Panel{
				DisplayedName: "simple gauge chart",
				Kind:          KindGaugeChart,
				Chart: &GaugeChart{
					Expr: "up",
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Panel{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshalPanelError(t *testing.T) {
	testSuite := []struct {
		title string
		jason string
		err   error
	}{
		{
			title: "panel.kind is empty",
			jason: `
{
}
`,
			err: fmt.Errorf("panel.kind cannot be empty"),
		},
		{
			title: "panel.kind is wrong",
			jason: `
{
  "kind": "UnknownChart"
}
`,
			err: fmt.Errorf("unknown panel.kind \"UnknownChart\" used"),
		},
		{
			title: "no lines defined for a lineChart",
			jason: `
{
  "kind": "LineChart",
  "chart": {}
}
`,
			err: fmt.Errorf("you need to define at least one line for a LineChart"),
		},
		{
			title: "displayed_name cannot be empty",
			jason: `
{
  "kind": "GaugeChart",
  "chart": {
    "expr": "up"
  }
}
`,
			err: fmt.Errorf("panel.displayed_name cannot be empty"),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Panel{}
			assert.Equal(t, test.err, json.Unmarshal([]byte(test.jason), &result))
		})
	}
}
