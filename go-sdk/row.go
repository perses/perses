// Copyright 2024 The Perses Authors
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

package sdk

import (
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
)

func NewRow(title string) *RowBuilder {
	return &RowBuilder{
		grid: dashboard.GridLayoutSpec{
			Display: &dashboard.GridLayoutDisplay{
				Title:    title,
				Collapse: &dashboard.GridLayoutCollapse{Open: true},
			},
			Items: []dashboard.GridItem{},
		},
		columns: 2,
		panels:  []v1.Panel{},
	}
}

type RowBuilder struct {
	grid    dashboard.GridLayoutSpec
	columns int
	panels  []v1.Panel
}

func (b *RowBuilder) Build() dashboard.GridLayoutSpec {
	return b.grid
}

func (b *RowBuilder) WithTitle(title string) *RowBuilder {
	if b.grid.Display == nil {
		b.grid.Display = &dashboard.GridLayoutDisplay{
			Title: title,
		}
	}
	b.grid.Display.Title = title
	return b
}

func (b *RowBuilder) IsCollapsing(enabled bool) *RowBuilder {
	if b.grid.Display == nil {
		b.grid.Display = &dashboard.GridLayoutDisplay{
			Collapse: &dashboard.GridLayoutCollapse{Open: !enabled},
		}
	}
	if b.grid.Display.Collapse == nil {
		b.grid.Display.Collapse = &dashboard.GridLayoutCollapse{Open: !enabled}
	}
	b.grid.Display.Collapse.Open = !enabled
	return b
}

func (b *RowBuilder) AddPanel(panel v1.Panel) *RowBuilder {
	x := (len(b.grid.Items) * (24 / b.columns)) % 24
	y := (len(b.grid.Items) * (24 / b.columns)) / 24
	//ref := strconv.Itoa(len(b.grid.Items))
	b.grid.Items = append(b.grid.Items, dashboard.GridItem{
		X:      x,
		Y:      y,
		Width:  24 / b.columns,
		Height: 6,
		Content: &common.JSONRef{
			Ref: "#/spec/panels/", // TODO
		},
	})
	b.panels = append(b.panels, panel)
	return b
}
