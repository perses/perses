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

package timeseries

import "github.com/perses/perses/go-sdk/common"

func WithLegend(legend Legend) Option {
	return func(builder *Builder) error {
		builder.Legend = &legend
		return nil
	}
}

func WithTooltip(tooltip Tooltip) Option {
	return func(builder *Builder) error {
		builder.Tooltip = &tooltip
		return nil
	}
}

func WithYAxis(axis YAxis) Option {
	return func(builder *Builder) error {
		builder.YAxis = &axis
		return nil
	}
}

func Thresholds(thresholds common.Thresholds) Option {
	return func(builder *Builder) error {
		builder.Thresholds = &thresholds
		return nil
	}
}

func WithVisual(visual Visual) Option {
	return func(builder *Builder) error {
		builder.Visual = &visual
		return nil
	}
}

func WithQuerySettings(querySettingsList []QuerySettingsItem) Option {
	return func(builder *Builder) error {
		builder.QuerySettings = &querySettingsList
		return nil
	}
}
