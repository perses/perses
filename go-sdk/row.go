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
	"fmt"
	"math"
)

type Row struct {
	Title        string
	PanelsWidth  int
	PanelsHeight int
	IsCollapsed  bool
}

func NewRow(title string) *RowBuilder {
	return &RowBuilder{
		Row: Row{
			Title:        title,
			PanelsWidth:  12,
			PanelsHeight: 6,
			IsCollapsed:  false,
		},
	}
}

func NewRowBuilder(row Row) *RowBuilder {
	return &RowBuilder{
		Row: row,
	}
}

type RowBuilder struct {
	Row
}

func (b *RowBuilder) Build() Row {
	return b.Row
}

func (b *RowBuilder) WithTitle(title string) *RowBuilder {
	b.Title = title
	return b
}

func (b *RowBuilder) Collapsed(enabled bool) *RowBuilder {
	b.IsCollapsed = enabled
	return b
}

func (b *RowBuilder) WithPanelsPerLine(panelsPerLine int) *RowBuilder {
	if panelsPerLine < 1 || panelsPerLine > 24 {
		fmt.Print("at least 1 panel and 24 panels max per row line")
		return b
	}
	b.PanelsWidth = int(math.Floor(float64(24 / panelsPerLine)))
	return b
}

func (b *RowBuilder) WithPanelWidth(width int) *RowBuilder {
	if width < 1 || width > 24 {
		fmt.Print("panel width is contained to 1 and 24")
		return b
	}
	b.PanelsWidth = width
	return b
}

func (b *RowBuilder) WithPanelHeight(height int) *RowBuilder {
	if height < 1 || height > 24 {
		fmt.Print("panel height can't be negative or zero")
		return b
	}
	b.PanelsHeight = height
	return b
}
