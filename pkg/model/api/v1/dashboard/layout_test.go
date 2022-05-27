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
	"testing"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

func TestUnmarshalJSONLayout(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		result Layout
	}{
		{
			title: "grid layout",
			jason: `
{
  "kind": "Grid",
  "spec": {
    "items": [
      {
        "x": 0,
        "y": 0,
        "width": 3,
        "height": 4,
        "content": { "$ref": "#/panels/gaugeCpuBusy" }
      },
      {
        "x": 3,
        "y": 0,
        "width": 3,
        "height": 4,
        "content": { "$ref": "#/panels/gaugeSystemLoad" }
      }
    ]
  }
}
`,
			result: Layout{
				Kind: KindGridLayout,
				Spec: &GridLayoutSpec{
					Items: []GridItem{
						{
							X:      0,
							Y:      0,
							Width:  3,
							Height: 4,
							Content: &common.JSONRef{
								Ref:  "#/panels/gaugeCpuBusy",
								Path: []string{"panels", "gaugeCpuBusy"},
							},
						},
						{
							X:      3,
							Y:      0,
							Width:  3,
							Height: 4,
							Content: &common.JSONRef{
								Ref:  "#/panels/gaugeSystemLoad",
								Path: []string{"panels", "gaugeSystemLoad"},
							},
						},
					},
				},
			},
		},
		{
			title: "expand layout",
			jason: `
{
  "kind": "Grid",
  "spec": {
    "display": {
      "title": "My Expending Grid",
      "collapse": {
        "open": true
      }
    },
    "items": [
      {
        "x": 0,
        "y": 0,
        "width": 3,
        "height": 4,
        "content": { "$ref": "#/panels/gaugeCpuBusy" }
      },
      {
        "x": 3,
        "y": 0,
        "width": 3,
        "height": 4,
        "content": { "$ref": "#/panels/gaugeSystemLoad" }
      }
    ]
  }
}
`,
			result: Layout{
				Kind: KindGridLayout,
				Spec: &GridLayoutSpec{
					Display: &GridLayoutDisplay{
						Title:    "My Expending Grid",
						Collapse: &GridLayoutCollapse{Open: true},
					},
					Items: []GridItem{
						{
							X:      0,
							Y:      0,
							Width:  3,
							Height: 4,
							Content: &common.JSONRef{
								Ref:  "#/panels/gaugeCpuBusy",
								Path: []string{"panels", "gaugeCpuBusy"},
							},
						},
						{
							X:      3,
							Y:      0,
							Width:  3,
							Height: 4,
							Content: &common.JSONRef{
								Ref:  "#/panels/gaugeSystemLoad",
								Path: []string{"panels", "gaugeSystemLoad"},
							},
						},
					},
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Layout{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshalYAMLLayout(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result Layout
	}{
		{
			title: "grid layout",
			yamele: `
kind: "Grid"
spec:
  items:
  - x: 0
    y: 0
    width: 3
    height: 4
    content: 
      $ref: "#/panels/gaugeCpuBusy"
  - x: 3
    y: 0
    width: 3
    height: 4
    content: 
      $ref: "#/panels/gaugeSystemLoad"
`,
			result: Layout{
				Kind: KindGridLayout,
				Spec: &GridLayoutSpec{
					Items: []GridItem{
						{
							X:      0,
							Y:      0,
							Width:  3,
							Height: 4,
							Content: &common.JSONRef{
								Ref:  "#/panels/gaugeCpuBusy",
								Path: []string{"panels", "gaugeCpuBusy"},
							},
						},
						{
							X:      3,
							Y:      0,
							Width:  3,
							Height: 4,
							Content: &common.JSONRef{
								Ref:  "#/panels/gaugeSystemLoad",
								Path: []string{"panels", "gaugeSystemLoad"},
							},
						},
					},
				},
			},
		},
		{
			title: "expand layout",
			yamele: `
kind: "Grid"
spec:
  display:
    title: "My Expending Grid"
    collapse:
      open: true
  items:
  - x: 0
    y: 0
    width: 3
    height: 4
    content: 
      $ref: "#/panels/gaugeCpuBusy"
  - x: 3
    y: 0
    width: 3
    height: 4
    content: 
      $ref: "#/panels/gaugeSystemLoad"
`,
			result: Layout{
				Kind: KindGridLayout,
				Spec: &GridLayoutSpec{
					Display: &GridLayoutDisplay{
						Title:    "My Expending Grid",
						Collapse: &GridLayoutCollapse{Open: true},
					},
					Items: []GridItem{
						{
							X:      0,
							Y:      0,
							Width:  3,
							Height: 4,
							Content: &common.JSONRef{
								Ref:  "#/panels/gaugeCpuBusy",
								Path: []string{"panels", "gaugeCpuBusy"},
							},
						},
						{
							X:      3,
							Y:      0,
							Width:  3,
							Height: 4,
							Content: &common.JSONRef{
								Ref:  "#/panels/gaugeSystemLoad",
								Path: []string{"panels", "gaugeSystemLoad"},
							},
						},
					},
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Layout{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), &result))
			assert.Equal(t, test.result, result)
		})
	}
}
