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
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

func TestUnmarshallJSONPanel(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		result Panel
	}{
		{
			title: "line chart",
			jason: `
{
  "order": 0,
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
				Order: 0,
				Kind:  KindLineChart,
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
  "order": 0,
  "kind": "GaugeChart",
  "chart": {
    "expr": "up"
  }
}
`,
			result: Panel{
				Order: 0,
				Kind:  KindGaugeChart,
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

func TestUnmarshallYAMLPanel(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result Panel
	}{
		{
			title: "line chart",
			yamele: `
order: 0
kind: "LineChart"
chart:
  lines:
  - expr: "up{instance='localhost:8080'}"
`,
			result: Panel{
				Order: 0,
				Kind:  KindLineChart,
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
order: 0
kind: "GaugeChart"
chart:
  expr: "up"
`,
			result: Panel{
				Order: 0,
				Kind:  KindGaugeChart,
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

func TestUnmarshallPanelError(t *testing.T) {
	testSuite := []struct {
		title string
		jason string
		err   error
	}{
		{
			title: "panel.kind is empty",
			jason: `
{
  "name": "myPanel"
}
`,
			err: fmt.Errorf("panel.kind cannot be empty"),
		},
		{
			title: "panel.kind is wrong",
			jason: `
{
  "name": "myPanel",
  "kind": "UnknownChart"
}
`,
			err: fmt.Errorf("unknown panel.kind 'UnknownChart' used"),
		},
		{
			title: "no lines defined for a lineChart",
			jason: `
{
  "name": "myPanel",
  "kind": "LineChart",
  "chart": {}
}
`,
			err: fmt.Errorf("you need to define at least one line for a LineChart"),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Panel{}
			assert.Equal(t, test.err, json.Unmarshal([]byte(test.jason), &result))
		})
	}
}
