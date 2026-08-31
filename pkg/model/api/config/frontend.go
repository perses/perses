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
	"time"
	_ "time/tzdata"

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

type FrontendTheme string

const defaultRowsPerPage uint8 = 25

var allowedRowsPerPage = []uint8{10, 25, 50, 100}

const (
	DarkTheme  FrontendTheme = "dark"
	LightTheme FrontendTheme = "light"
)

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

type AutoRefresh struct {
	Disable bool `json:"disable,omitempty" yaml:"disable,omitempty"`
}

// DefaultUserPreferences contains the preferences used when the user has not
// stored an explicit preference in their browser.
type DefaultUserPreferences struct {
	Timezone    string        `json:"timezone,omitempty" yaml:"timezone,omitempty"`
	RowsPerPage uint8         `json:"rows_per_page,omitempty" yaml:"rows_per_page,omitempty"`
	Theme       FrontendTheme `json:"theme,omitempty" yaml:"theme,omitempty"`
}

func (p *DefaultUserPreferences) Verify() error {
	if len(p.Timezone) > 0 && p.Timezone != "local" {
		if _, err := time.LoadLocation(p.Timezone); err != nil {
			return fmt.Errorf("invalid frontend.default_user_preferences.timezone %q: %w", p.Timezone, err)
		}
	}
	if p.RowsPerPage == 0 {
		p.RowsPerPage = defaultRowsPerPage
	}
	if !slices.Contains(allowedRowsPerPage, p.RowsPerPage) {
		return fmt.Errorf("frontend.default_user_preferences.rows_per_page must be one of: 10, 25, 50, 100")
	}
	if len(p.Theme) == 0 {
		p.Theme = LightTheme
	}
	if p.Theme != LightTheme && p.Theme != DarkTheme {
		return fmt.Errorf("frontend.default_user_preferences.theme must be one of: light, dark")
	}
	return nil
}

func (t *TimeRange) Verify() error {
	if len(t.Options) == 0 {
		t.Options = defaultTimeRangeOptions
	}
	sortedOptions, err := sortTimeRangeOptions(t.Options)
	if err != nil {
		return err
	}
	t.Options = sortedOptions
	return nil
}

// sortTimeRangeOptions returns the given duration options sorted in ascending order,
// so that the time range dropdown in the UI is always displayed from shortest to longest.
func sortTimeRangeOptions(options []common.DurationString) ([]common.DurationString, error) {
	type parsedOption struct {
		raw      common.DurationString
		duration common.Duration
	}
	parsedOptions := make([]parsedOption, 0, len(options))
	for _, opt := range options {
		duration, err := common.ParseDuration(string(opt))
		if err != nil {
			return nil, fmt.Errorf("invalid frontend.time_range.options value '%s': %w", opt, err)
		}
		parsedOptions = append(parsedOptions, parsedOption{raw: opt, duration: duration})
	}
	slices.SortStableFunc(parsedOptions, func(a, b parsedOption) int {
		switch {
		case a.duration < b.duration:
			return -1
		case a.duration > b.duration:
			return 1
		default:
			return 0
		}
	})
	sorted := make([]common.DurationString, len(parsedOptions))
	for i, opt := range parsedOptions {
		sorted[i] = opt.raw
	}
	return sorted, nil
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
	// AutoRefresh contains the auto-refresh configuration for dashboards
	AutoRefresh *AutoRefresh `json:"auto_refresh,omitempty" yaml:"auto_refresh,omitempty"`
	// BannerInfo contains the content to be display in a banner at the top of each page along with the severity of the information
	Banner *Banner `json:"banner,omitempty" yaml:"banner,omitempty"`
	// DefaultUserPreferences contains server-wide defaults for user preferences.
	DefaultUserPreferences *DefaultUserPreferences `json:"default_user_preferences,omitempty" yaml:"default_user_preferences,omitempty"`
}
