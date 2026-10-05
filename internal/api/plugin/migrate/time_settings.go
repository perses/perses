// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package migrate

import (
	"strconv"
	"strings"
	"time"

	"github.com/perses/spec/go/common"
)

const (
	// defaultDuration is used when the time range of the Grafana dashboard can't be migrated. It is also the default
	// duration of a Perses dashboard.
	defaultDuration common.DurationString = "1h"
	// grafanaDefaultDuration is the time range Grafana uses for a dashboard that has none (now-6h to now).
	grafanaDefaultDuration common.DurationString = "6h"
)

// grafanaUnitInDays gives, in days, the Grafana time units that a migrated duration doesn't keep. Perses has no
// month or quarter unit, so they are approximated. Perses has years, but Kubernetes rejects them in a
// PersesDashboard custom resource (OpenAPI "duration" format), so they are converted too.
var grafanaUnitInDays = map[string]uint64{
	"M": 30,  // month (approximation)
	"Q": 90,  // quarter (approximation)
	"y": 365, // year, same length as in Perses
}

// migrateDuration converts the default time range of a Grafana dashboard into the duration of the Perses dashboard.
// The default time range of a Perses dashboard is always relative to now ("the last X"), so only a Grafana time
// range starting at "now-<duration>" and ending at "now" or at a past "now-<duration>" is migrated. Any other time
// range (absolute dates, rounded ranges such as "now-1d/d", chained operations such as "now-1d-2h", a range ending
// in the future) falls back to the default duration.
func migrateDuration(timeRange *GrafanaTimeRange) common.DurationString {
	if timeRange == nil {
		return grafanaDefaultDuration
	}
	if to := removeWhitespace(timeRange.To); to != "now" {
		// The default time range of a Perses dashboard always ends at now: a range that ends before now (e.g.
		// "now-5m", to wait for late data, like Grafana's nowDelay setting) keeps its start.
		delay, ok := strings.CutPrefix(to, "now-")
		if !ok || migrateGrafanaDuration(delay) == "" {
			return defaultDuration
		}
	}
	pastDuration, ok := strings.CutPrefix(removeWhitespace(timeRange.From), "now-")
	if !ok {
		return defaultDuration
	}
	if duration := migrateGrafanaDuration(pastDuration); duration != "" {
		return duration
	}
	return defaultDuration
}

// removeWhitespace removes all the whitespace of a Grafana relative time. Grafana ignores the whitespace in the
// operations that follow "now", e.g. "now - 6h" means "now-6h".
func removeWhitespace(relativeTime string) string {
	return strings.Join(strings.Fields(relativeTime), "")
}

// migrateRefreshInterval converts the auto-refresh interval of a Grafana dashboard. An empty result means no
// auto-refresh (e.g. for the Grafana values "", "auto" or "LIVE").
func migrateRefreshInterval(refresh string) common.DurationString {
	return migrateGrafanaDuration(strings.TrimSpace(refresh))
}

// migrateGrafanaDuration converts a Grafana duration made of one count and one unit, such as "6h" or "6M", into a
// Perses duration that only uses the units s, m, h, d and w. It returns an empty string when the duration can't be
// converted or is zero.
func migrateGrafanaDuration(duration string) common.DurationString {
	if len(duration) < 2 {
		return ""
	}
	// A 32-bit count can't overflow once converted into days.
	count, err := strconv.ParseUint(duration[:len(duration)-1], 10, 32)
	if err != nil {
		return ""
	}
	unit := duration[len(duration)-1:]
	if days, ok := grafanaUnitInDays[unit]; ok {
		count, unit = count*days, "d"
	}
	converted := strconv.FormatUint(count, 10) + unit
	// ParseDuration rejects unknown units and durations out of range.
	if d, err := common.ParseDuration(converted); err != nil || d == 0 {
		return ""
	}
	return common.DurationString(converted)
}

// migrateTimezone converts the timezone of a Grafana dashboard. An empty result leaves the timezone of the Perses
// dashboard unset: the dashboard then follows the user preference, then the server default, then the browser.
func migrateTimezone(timezone string) string {
	timezone = strings.TrimSpace(timezone)
	switch strings.ToLower(timezone) {
	case "", "browser", "local":
		// "browser" is the default timezone of a new Grafana dashboard, so it rarely is a deliberate choice. Mapping
		// it to "local" would override the user preference and the server default on every migrated dashboard.
		return ""
	case "utc":
		// Grafana writes "utc", but the IANA name is "UTC" ("utc" only loads on a case-insensitive file system).
		return "UTC"
	}
	// Same check as the validation of the dashboard spec (validateTimezone in github.com/perses/spec). It runs on
	// the host doing the migration: on a case-insensitive file system (e.g. macOS), a name with the wrong case passes.
	if _, err := time.LoadLocation(timezone); err != nil {
		return ""
	}
	return timezone
}
