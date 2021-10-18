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
  "parameter": {
    "children": [
      [
        {
          "width": 1
        },
        {
          "width": 1,
          "content": {
            "$ref": "#/panels/cpu"
          }
        }
      ],
      [
        {
          "width": 1,
          "content": {
            "$ref": "#/panels/load"
          }
        },
        {
          "width": 1
        }
      ]
    ]
  }
}
`,
			result: Layout{
				Kind: KindGridLayout,
				Parameter: &GridLayoutParameter{
					Children: [][]GridCell{
						{
							{
								Width:   1,
								Content: nil,
							},
							{
								Width: 1,
								Content: &common.JSONRef{
									Ref:  "#/panels/cpu",
									Path: []string{"panels", "cpu"},
								},
							},
						},
						{
							{
								Width: 1,
								Content: &common.JSONRef{
									Ref:  "#/panels/load",
									Path: []string{"panels", "load"},
								},
							},
							{
								Width: 1,
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
  "kind": "Expand",
  "parameter": {
    "open": true,
    "children": [
      {
        "$ref": "#/layouts/mainGrid"
      }
    ]
  }
}
`,
			result: Layout{
				Kind: KindExpandLayout,
				Parameter: &ExpandLayoutParameter{
					Open: true,
					Children: []*common.JSONRef{
						{
							Ref:    "#/layouts/mainGrid",
							Path:   []string{"layouts", "mainGrid"},
							Object: nil,
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
parameter:
  children:
  - - width: 1
    - width: 1
      content:
        $ref: "#/panels/cpu"
  - - width: 1
      content:
        $ref: "#/panels/load"
    - width: 1
`,
			result: Layout{
				Kind: KindGridLayout,
				Parameter: &GridLayoutParameter{
					Children: [][]GridCell{
						{
							{
								Width:   1,
								Content: nil,
							},
							{
								Width: 1,
								Content: &common.JSONRef{
									Ref:  "#/panels/cpu",
									Path: []string{"panels", "cpu"},
								},
							},
						},
						{
							{
								Width: 1,
								Content: &common.JSONRef{
									Ref:  "#/panels/load",
									Path: []string{"panels", "load"},
								},
							},
							{
								Width: 1,
							},
						},
					},
				},
			},
		},
		{
			title: "expand layout",
			yamele: `
kind: "Expand"
parameter:
  open: true
  children:
  - "$ref": "#/layouts/mainGrid"
`,
			result: Layout{
				Kind: KindExpandLayout,
				Parameter: &ExpandLayoutParameter{
					Open: true,
					Children: []*common.JSONRef{
						{
							Ref:    "#/layouts/mainGrid",
							Path:   []string{"layouts", "mainGrid"},
							Object: nil,
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
