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

package row

import (
	"fmt"
	"math"

	"github.com/perses/perses/go-sdk/panel"
)

func Title(title string) Option {
	return func(builder *Builder) error {
		builder.Title = title
		return nil
	}
}

func PanelWidth(width int) Option {
	return func(builder *Builder) error {
		if width < 1 || width > 24 {
			return fmt.Errorf("panel width is contained to 1 and 24")
		}
		builder.PanelsWidth = width
		return nil
	}
}

func PanelHeight(height int) Option {
	return func(builder *Builder) error {
		if height < 1 || height > 24 {
			return fmt.Errorf("panel height can't be negative or zero")
		}
		builder.PanelsHeight = height
		return nil
	}
}

func Collapsed(isCollapsed bool) Option {
	return func(builder *Builder) error {
		builder.IsCollapsed = isCollapsed
		return nil
	}
}

func PanelsPerLine(panelsPerLine int) Option {
	return func(builder *Builder) error {
		if panelsPerLine < 1 || panelsPerLine > 24 {
			return fmt.Errorf("row: at least 1 panel and 24 panels max per row line")
		}
		builder.PanelsWidth = int(math.Floor(float64(24 / panelsPerLine)))
		return nil
	}
}

func Panel(title string, options ...panel.Option) Option {
	return func(builder *Builder) error {
		p, err := panel.New(title, options...)
		if err != nil {
			return err
		}
		builder.Panels = append(builder.Panels, p.Panel)
		return nil
	}
}
