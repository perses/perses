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

package config

import (
	"fmt"
	"slices"

	"github.com/perses/spec/go/common"
)

var defaultTimeRangeOptions = []common.DurationString{
	"5m",
	"15m",
	"30m",
	"1h",
	"6h",
	"12h",
	"24h",
	"7d",
	"14d",
}

var allowedRowsPerPage = []int{10, 25, 50, 100}

type Explorer struct {
	Enable bool `json:"enable" yaml:"enable"`
}

type Banner struct {
	Severity string `json:"severity" yaml:"severity"`
	Message  string `json:"message" yaml:"message"`
}

func (b *Banner) Verify() error {
	allowedSeverities := []string{"error", "warning", "info"}
	if len(b.Severity) == 0 {
		b.Severity = "info"
	}
	if !slices.Contains(allowedSeverities, b.Severity) {
		return fmt.Errorf("invalid banner severity value '%s'. Must be one of: error, warning, info", b.Severity)
	}
	if len(b.Message) == 0 {
		return fmt.Errorf("frontend.banner.message is required when banner is filled")
	}
	return nil
}

type TimeRange struct {
	DisableCustomTimeRange bool                    `json:"disable_custom,omitempty" yaml:"disable_custom,omitempty"`
	DisableZoomTimeRange   bool                    `json:"disable_zoom,omitempty" yaml:"disable_zoom,omitempty"`
	Options                []common.DurationString `json:"options,omitempty" yaml:"options,omitempty"`
}

// DefaultUserPreferences contains the preferences used when the user has not
// stored an explicit preference in their browser.
type DefaultUserPreferences struct {
	Timezone    string `json:"timezone,omitempty" yaml:"timezone,omitempty"`
	RowsPerPage int    `json:"rows_per_page,omitempty" yaml:"rows_per_page,omitempty"`
	Theme       string `json:"theme,omitempty" yaml:"theme,omitempty"`
}

func (p *DefaultUserPreferences) Verify() error {
	if p.RowsPerPage < 0 {
		return fmt.Errorf("frontend.default_user_preferences.rows_per_page cannot be negative")
	}
	if p.RowsPerPage != 0 && !slices.Contains(allowedRowsPerPage, p.RowsPerPage) {
		return fmt.Errorf("frontend.default_user_preferences.rows_per_page must be one of: 10, 25, 50, 100")
	}
	if p.Theme != "" && p.Theme != "light" && p.Theme != "dark" {
		return fmt.Errorf("frontend.default_user_preferences.theme must be one of: light, dark")
	}
	return nil
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
	// EnableKeyboardShortcuts enables keyboard shortcuts in the UI. Defaults to true when omitted.
	EnableKeyboardShortcuts *bool `json:"enable_keyboard_shortcuts,omitempty" yaml:"enable_keyboard_shortcuts,omitempty"`
	// Explorer is activating the different kind of explorer supported.
	// Be sure you have installed an associated plugin for each explorer type.
	Explorer Explorer `json:"explorer" yaml:"explorer"`
	// Information contains Markdown content to be display on the home page
	Information string `json:"information,omitempty" yaml:"information,omitempty"`
	// ImportantDashboards contains important dashboard selectors
	ImportantDashboards []dashboardSelector `json:"important_dashboards,omitempty" yaml:"important_dashboards,omitempty"`
	// TimeRange contains the time range configuration for the dropdown
	TimeRange *TimeRange `json:"time_range,omitempty" yaml:"time_range,omitempty"`
	// BannerInfo contains the content to be display in a banner at the top of each page along with the severity of the information
	Banner *Banner `json:"banner,omitempty" yaml:"banner,omitempty"`
	// DefaultUserPreferences contains server-wide defaults for user preferences.
	DefaultUserPreferences *DefaultUserPreferences `json:"default_user_preferences,omitempty" yaml:"default_user_preferences,omitempty"`
}
