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

package dashboard_test

import (
	"fmt"
	"testing"

	"github.com/perses/perses/go-sdk/dashboard"
	panelgroup "github.com/perses/perses/go-sdk/panel-group"
	dashboardSpec "github.com/perses/spec/go/dashboard"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// panelGroupPositions builds a dashboard with one panel group made of the given options followed by nbPanels panels,
// and returns the positions of the panels.
func panelGroupPositions(t *testing.T, groupOptions []panelgroup.Option, nbPanels int) []dashboard.GridItem {
	t.Helper()

	options := make([]panelgroup.Option, 0, len(groupOptions)+nbPanels)
	options = append(options, groupOptions...)
	for i := range nbPanels {
		options = append(options, panelgroup.AddPanel(fmt.Sprintf("Panel %d", i)))
	}

	builder, err := dashboard.New("dashboard", dashboard.AddPanelGroup("Group", options...))
	require.NoError(t, err)
	require.Len(t, builder.Dashboard.Spec.Layouts, 1)

	spec, ok := builder.Dashboard.Spec.Layouts[0].Spec.(dashboardSpec.GridLayoutSpec)
	require.True(t, ok)

	positions := make([]dashboard.GridItem, 0, len(spec.Items))
	for _, item := range spec.Items {
		positions = append(positions, dashboard.GridItem{X: item.X, Y: item.Y, W: item.Width, H: item.Height})
	}
	return positions
}

func TestAddPanelGroupLayout(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		title     string
		nbPanels  int
		options   []panelgroup.Option
		positions []dashboard.GridItem
	}{
		{
			title:    "default width",
			nbPanels: 3,
			options:  []panelgroup.Option{panelgroup.PanelHeight(6)},
			positions: []dashboard.GridItem{
				{X: 0, Y: 0, W: 12, H: 6},
				{X: 12, Y: 0, W: 12, H: 6},
				{X: 0, Y: 6, W: 12, H: 6},
			},
		},
		{
			title:    "width not dividing the grid wraps before overflowing",
			nbPanels: 4,
			options:  []panelgroup.Option{panelgroup.PanelWidth(7)},
			positions: []dashboard.GridItem{
				{X: 0, Y: 0, W: 7, H: 8},
				{X: 7, Y: 0, W: 7, H: 8},
				{X: 14, Y: 0, W: 7, H: 8},
				{X: 0, Y: 8, W: 7, H: 8},
			},
		},
		{
			// Same positions as the CUE SDK with #cols: 5
			title:    "panels per line not dividing the grid",
			nbPanels: 6,
			options:  []panelgroup.Option{panelgroup.PanelsPerLine(5)},
			positions: []dashboard.GridItem{
				{X: 0, Y: 0, W: 4, H: 8},
				{X: 4, Y: 0, W: 4, H: 8},
				{X: 8, Y: 0, W: 4, H: 8},
				{X: 12, Y: 0, W: 4, H: 8},
				{X: 16, Y: 0, W: 4, H: 8},
				{X: 0, Y: 8, W: 4, H: 8},
			},
		},
		{
			title:    "panel width set after panels per line",
			nbPanels: 5,
			options:  []panelgroup.Option{panelgroup.PanelsPerLine(5), panelgroup.PanelWidth(6)},
			positions: []dashboard.GridItem{
				{X: 0, Y: 0, W: 6, H: 8},
				{X: 6, Y: 0, W: 6, H: 8},
				{X: 12, Y: 0, W: 6, H: 8},
				{X: 18, Y: 0, W: 6, H: 8},
				{X: 0, Y: 8, W: 6, H: 8},
			},
		},
		{
			title:    "negative panels per line set by a custom option",
			nbPanels: 3,
			options: []panelgroup.Option{func(builder *panelgroup.Builder) error {
				builder.PanelsPerLine = -2
				return nil
			}},
			positions: []dashboard.GridItem{
				{X: 0, Y: 0, W: 12, H: 8},
				{X: 12, Y: 0, W: 12, H: 8},
				{X: 0, Y: 8, W: 12, H: 8},
			},
		},
		{
			title:    "panel width set by a custom option after panels per line",
			nbPanels: 5,
			options: []panelgroup.Option{panelgroup.PanelsPerLine(5), func(builder *panelgroup.Builder) error {
				builder.PanelsWidth = 6
				return nil
			}},
			positions: []dashboard.GridItem{
				{X: 0, Y: 0, W: 6, H: 8},
				{X: 6, Y: 0, W: 6, H: 8},
				{X: 12, Y: 0, W: 6, H: 8},
				{X: 18, Y: 0, W: 6, H: 8},
				{X: 0, Y: 8, W: 6, H: 8},
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.title, func(t *testing.T) {
			t.Parallel()

			assert.Equal(t, tc.positions, panelGroupPositions(t, tc.options, tc.nbPanels))
		})
	}
}

// TestAddPanelGroupLayoutAllValidInputs checks every valid PanelWidth and PanelsPerLine value against the
// CUE SDK formula (cue/dac-utils/panelgroup): x = width * (i mod cols), y = height * trunc(i / cols).
func TestAddPanelGroupLayoutAllValidInputs(t *testing.T) {
	t.Parallel()

	const nbPanels = 25 // enough for a second line even with 24 panels per line
	const height = 8    // default panel height, same as the CUE SDK

	for value := 1; value <= 24; value++ {
		inputs := []struct {
			title  string
			option panelgroup.Option
			width  int
			cols   int
		}{
			{title: fmt.Sprintf("PanelWidth(%d)", value), option: panelgroup.PanelWidth(value), width: value, cols: 24 / value},
			{title: fmt.Sprintf("PanelsPerLine(%d)", value), option: panelgroup.PanelsPerLine(value), width: 24 / value, cols: value},
		}
		for _, input := range inputs {
			t.Run(input.title, func(t *testing.T) {
				t.Parallel()

				positions := panelGroupPositions(t, []panelgroup.Option{input.option}, nbPanels)
				require.Len(t, positions, nbPanels)
				for i, position := range positions {
					assert.LessOrEqual(t, position.X+position.W, 24, "panel %d exceeds the grid", i)
					assert.Equal(t, dashboard.GridItem{
						X: input.width * (i % input.cols),
						Y: height * (i / input.cols),
						W: input.width,
						H: height,
					}, position, "panel %d", i)
				}
			})
		}
	}
}

func TestAddPanelGroupInvalidWidth(t *testing.T) {
	t.Parallel()

	for _, width := range []int{0, 25} {
		t.Run(fmt.Sprintf("width %d", width), func(t *testing.T) {
			t.Parallel()

			setWidth := func(builder *panelgroup.Builder) error {
				builder.PanelsWidth = width
				return nil
			}
			_, err := dashboard.New("dashboard", dashboard.AddPanelGroup("Group", setWidth, panelgroup.AddPanel("Panel")))
			require.Error(t, err)
		})
	}
}
