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
	"fmt"

	"github.com/perses/spec/go/dashboard"
)

// gridColumnsCount is the number of columns of the dashboard grid.
// In the UI, a layout item can span at most these columns.
const gridColumnsCount = 24

// validateDashboardLayouts checks that the grid items of the dashboard layouts have valid dimensions
// and fit within the grid.
func validateDashboardLayouts(spec dashboard.Spec) error {
	for i, layout := range spec.Layouts {
		switch l := layout.Spec.(type) {
		case *dashboard.GridLayoutSpec:
			if err := validateGridItems(l.Items, fmt.Sprintf("the grid layout #%d", i+1)); err != nil {
				return err
			}
		case *dashboard.TabLayoutSpec:
			for _, tab := range l.Tabs {
				if err := validateGridItems(tab.Items, fmt.Sprintf("tab %q of the tab layout #%d", tab.Name, i+1)); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

// validateGridItems checks the dimensions and positions of the given grid items.
// itemsOwner identifies where the items belong (a grid layout, or one tab of a tab layout).
func validateGridItems(items []dashboard.GridItem, itemsOwner string) error {
	for i, item := range items {
		itemName := fmt.Sprintf("layout item #%d of %s", i+1, itemsOwner)
		if item.Width < 1 || item.Height < 1 {
			return fmt.Errorf("%s has invalid dimensions: width %d and height %d, but they must be strictly positive", itemName, item.Width, item.Height)
		}
		if item.X < 0 || item.Y < 0 {
			return fmt.Errorf("%s has an invalid position: x %d and y %d, but they cannot be negative", itemName, item.X, item.Y)
		}
		if item.X+item.Width > gridColumnsCount {
			return fmt.Errorf("%s doesn't fit the grid: it ends at column %d, but the grid has only %d columns", itemName, item.X+item.Width, gridColumnsCount)
		}
	}
	return nil
}
