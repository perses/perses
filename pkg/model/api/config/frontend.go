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

package config

import (
	"time"

	"github.com/perses/perses/pkg/model/api/v1/common"
)

var defaultTimeRangeOptions = []common.Duration{
	common.Duration(5 * time.Minute),
	common.Duration(15 * time.Minute),
	common.Duration(30 * time.Minute),
	common.Duration(1 * time.Hour),
	common.Duration(6 * time.Hour),
	common.Duration(12 * time.Hour),
	common.Duration(24 * time.Hour),
	common.Duration(7 * 24 * time.Hour),
	common.Duration(14 * 24 * time.Hour),
}

type Explorer struct {
	Enable bool `json:"enable" yaml:"enable"`
}

type TimeRange struct {
	DisableCustomTimeRange  bool              `json:"disable_custom" yaml:"disable_custom"`
	DisableZoomTimeRange    bool              `json:"disable_zoom" yaml:"disable_zoom"`
	Options                 []common.Duration `json:"options,omitempty" yaml:"options,omitempty"`
}

func (t *TimeRange) Verify() error {
	if len(t.Options) == 0 {
		t.Options = defaultTimeRangeOptions
	}
	return nil
}

type Frontend struct {
	// When it is true, Perses won't serve the frontend anymore, and any other config set here will be ignored
	Disable bool `json:"disable" yaml:"disable"`
	// Explorer is activating the different kind of explorer supported.
	// Be sure you have installed an associated plugin for each explorer type.
	Explorer Explorer `json:"explorer" yaml:"explorer"`
	// Information contains markdown content to be display on the home page
	Information string `json:"information,omitempty" yaml:"information,omitempty"`
	// ImportantDashboards contains important dashboard selectors
	ImportantDashboards []dashboardSelector `json:"important_dashboards,omitempty" yaml:"important_dashboards,omitempty"`
	// TimeRange contains the time range configuration for the dropdown
	TimeRange TimeRange `json:"time_range,omitempty" yaml:"time_range,omitempty"`
}
