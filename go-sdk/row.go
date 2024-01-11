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

// TODO: utils for calculating width automatically with X panels per line

func (b *RowBuilder) WithPanelWidth(width int) *RowBuilder {
	// TODO: validation
	b.PanelsWidth = width
	return b
}

func (b *RowBuilder) WithPanelHeight(height int) *RowBuilder {
	// TODO: validation
	b.PanelsHeight = height
	return b
}
