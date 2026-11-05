// Copyright The Perses Authors
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

package validate

import (
	"testing"

	"github.com/perses/spec/go/common"
	"github.com/perses/spec/go/dashboard"
	"github.com/stretchr/testify/assert"
)

func panelRef(name string) *common.JSONRef {
	return &common.JSONRef{
		Ref:  "#/spec/panels/" + name,
		Path: []string{"spec", "panels", name},
	}
}

func gridLayout(items ...dashboard.GridItem) dashboard.Layout {
	return dashboard.Layout{
		Kind: dashboard.KindGridLayout,
		Spec: &dashboard.GridLayoutSpec{Items: items},
	}
}

func item(panelName string, x, y, width, height int) dashboard.GridItem {
	return dashboard.GridItem{
		X:       x,
		Y:       y,
		Width:   width,
		Height:  height,
		Content: panelRef(panelName),
	}
}

func TestDashboardSpecGridLayouts(t *testing.T) {
	testSuites := []struct {
		title       string
		spec        dashboard.Spec
		expectedErr string
	}{
		{
			title: "valid grid layout fitting the 24 columns grid",
			spec: dashboard.Spec{
				Panels: map[string]*dashboard.Panel{
					"a": {},
					"b": {},
				},
				Layouts: []dashboard.Layout{
					gridLayout(item("a", 0, 0, 24, 6), item("b", 0, 6, 12, 6)),
				},
			},
		},
		{
			title: "valid tab layout",
			spec: dashboard.Spec{
				Panels: map[string]*dashboard.Panel{
					"a": {},
					"b": {},
				},
				Layouts: []dashboard.Layout{
					{
						Kind: dashboard.KindTabLayout,
						Spec: &dashboard.TabLayoutSpec{
							Tabs: []dashboard.TabItem{
								{Name: "first", Items: []dashboard.GridItem{item("a", 0, 0, 12, 6)}},
								{Name: "second", Items: []dashboard.GridItem{item("b", 0, 0, 24, 6)}},
							},
						},
					},
				},
			},
		},
		{
			title: "item larger than the number of columns of the grid",
			spec: dashboard.Spec{
				Panels: map[string]*dashboard.Panel{"a": {}},
				Layouts: []dashboard.Layout{
					gridLayout(item("a", 0, 0, 40, 6)),
				},
			},
			expectedErr: `layout item #1 of the grid layout #1 doesn't fit the grid: it ends at column 40, but the grid has only 24 columns`,
		},
		{
			title: "item extending past the last column",
			spec: dashboard.Spec{
				Panels: map[string]*dashboard.Panel{"a": {}},
				Layouts: []dashboard.Layout{
					gridLayout(item("a", 20, 0, 12, 6)),
				},
			},
			expectedErr: `layout item #1 of the grid layout #1 doesn't fit the grid: it ends at column 32, but the grid has only 24 columns`,
		},
		{
			title: "item with a zero height",
			spec: dashboard.Spec{
				Panels: map[string]*dashboard.Panel{"a": {}},
				Layouts: []dashboard.Layout{
					gridLayout(item("a", 0, 0, 12, 0)),
				},
			},
			expectedErr: `layout item #1 of the grid layout #1 has invalid dimensions: width 12 and height 0, but they must be strictly positive`,
		},
		{
			title: "item with a negative position",
			spec: dashboard.Spec{
				Panels: map[string]*dashboard.Panel{"a": {}},
				Layouts: []dashboard.Layout{
					gridLayout(item("a", -1, 0, 12, 6)),
				},
			},
			expectedErr: `layout item #1 of the grid layout #1 has an invalid position: x -1 and y 0, but they cannot be negative`,
		},
		{
			title: "tab item larger than the number of columns of the grid",
			spec: dashboard.Spec{
				Panels: map[string]*dashboard.Panel{"a": {}},
				Layouts: []dashboard.Layout{
					{
						Kind: dashboard.KindTabLayout,
						Spec: &dashboard.TabLayoutSpec{
							Tabs: []dashboard.TabItem{
								{Name: "first", Items: []dashboard.GridItem{item("a", 0, 0, 40, 6)}},
							},
						},
					},
				},
			},
			expectedErr: `layout item #1 of tab "first" of the tab layout #1 doesn't fit the grid: it ends at column 40, but the grid has only 24 columns`,
		},
	}
	for _, test := range testSuites {
		t.Run(test.title, func(t *testing.T) {
			err := DashboardSpec(test.spec, nil, nil)
			if len(test.expectedErr) == 0 {
				assert.NoError(t, err)
			} else {
				assert.EqualError(t, err, test.expectedErr)
			}
		})
	}
}
