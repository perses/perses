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
	"testing"
	// So that the timezone cases also pass on a host without a timezone database.
	_ "time/tzdata"

	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
)

func TestMigrateDuration(t *testing.T) {
	tests := []struct {
		title     string
		timeRange *GrafanaTimeRange
		expected  common.DurationString
	}{
		{title: "no time range gives the default time range of Grafana", timeRange: nil, expected: "6h"},
		// Time ranges that end at now, e.g. the quick ranges of Grafana
		{title: "last 5 minutes", timeRange: &GrafanaTimeRange{From: "now-5m", To: "now"}, expected: "5m"},
		{title: "last 30 seconds", timeRange: &GrafanaTimeRange{From: "now-30s", To: "now"}, expected: "30s"},
		{title: "last 6 hours", timeRange: &GrafanaTimeRange{From: "now-6h", To: "now"}, expected: "6h"},
		{title: "last 24 hours", timeRange: &GrafanaTimeRange{From: "now-24h", To: "now"}, expected: "24h"},
		{title: "last 30 days", timeRange: &GrafanaTimeRange{From: "now-30d", To: "now"}, expected: "30d"},
		{title: "last 2 weeks", timeRange: &GrafanaTimeRange{From: "now-2w", To: "now"}, expected: "2w"},
		{title: "last 6 months, a month counts as 30 days", timeRange: &GrafanaTimeRange{From: "now-6M", To: "now"}, expected: "180d"},
		{title: "last 2 quarters, a quarter counts as 90 days", timeRange: &GrafanaTimeRange{From: "now-2Q", To: "now"}, expected: "180d"},
		{title: "last 5 years, converted into days", timeRange: &GrafanaTimeRange{From: "now-5y", To: "now"}, expected: "1825d"},
		{title: "count with a leading zero", timeRange: &GrafanaTimeRange{From: "now-06h", To: "now"}, expected: "6h"},
		// Grafana reads a missing count as 1
		{title: "implicit count", timeRange: &GrafanaTimeRange{From: "now-d", To: "now"}, expected: "1d"},
		{title: "implicit count in months", timeRange: &GrafanaTimeRange{From: "now-M", To: "now"}, expected: "30d"},
		// Grafana ignores the whitespace after "now"
		{title: "whitespace around the operator", timeRange: &GrafanaTimeRange{From: "now - 6h", To: "now"}, expected: "6h"},
		{title: "whitespace before the unit", timeRange: &GrafanaTimeRange{From: "now-6 h", To: "now"}, expected: "6h"},
		// More lenient than Grafana, which rejects whitespace before "now"
		{title: "whitespace around the time range", timeRange: &GrafanaTimeRange{From: " now-6h ", To: " now "}, expected: "6h"},
		// A time range that ends before now keeps its start
		{title: "ending 5 minutes before now", timeRange: &GrafanaTimeRange{From: "now-6h", To: "now-5m"}, expected: "6h"},
		{title: "last 7 days without the last day", timeRange: &GrafanaTimeRange{From: "now-7d", To: "now-1d"}, expected: "7d"},
		{title: "delay with whitespace", timeRange: &GrafanaTimeRange{From: "now-6h", To: "now - 5m"}, expected: "6h"},
		{title: "delay in months", timeRange: &GrafanaTimeRange{From: "now-1y", To: "now-6M"}, expected: "365d"},
		{title: "delay with an implicit count", timeRange: &GrafanaTimeRange{From: "now-7d", To: "now-d"}, expected: "7d"},
		// Any other time range gives the default duration of Perses
		{title: "invalid start with a delay", timeRange: &GrafanaTimeRange{From: "now-6x", To: "now-5m"}, expected: "1h"},
		{title: "today so far", timeRange: &GrafanaTimeRange{From: "now/d", To: "now"}, expected: "1h"},
		{title: "yesterday", timeRange: &GrafanaTimeRange{From: "now-1d/d", To: "now-1d/d"}, expected: "1h"},
		{title: "rounded start", timeRange: &GrafanaTimeRange{From: "now-7d/d", To: "now"}, expected: "1h"},
		{title: "rounded end", timeRange: &GrafanaTimeRange{From: "now-7d", To: "now-1d/d"}, expected: "1h"},
		{title: "ending in the future", timeRange: &GrafanaTimeRange{From: "now-6h", To: "now+1h"}, expected: "1h"},
		{title: "unknown unit in the delay", timeRange: &GrafanaTimeRange{From: "now-6h", To: "now-5x"}, expected: "1h"},
		{title: "chained operations in the delay", timeRange: &GrafanaTimeRange{From: "now-6h", To: "now-1d-2h"}, expected: "1h"},
		{title: "absolute dates", timeRange: &GrafanaTimeRange{From: "2023-10-25T10:00:00.000Z", To: "2023-10-25T16:00:00.000Z"}, expected: "1h"},
		{title: "absolute dates in epoch milliseconds", timeRange: &GrafanaTimeRange{From: "1698228000000", To: "1698249600000"}, expected: "1h"},
		{title: "empty time range", timeRange: &GrafanaTimeRange{}, expected: "1h"},
		{title: "chained operations", timeRange: &GrafanaTimeRange{From: "now-1d-2h", To: "now"}, expected: "1h"},
		{title: "several units, not supported by Grafana", timeRange: &GrafanaTimeRange{From: "now-1h30m", To: "now"}, expected: "1h"},
		{title: "zero duration", timeRange: &GrafanaTimeRange{From: "now-0h", To: "now"}, expected: "1h"},
		{title: "zero without unit", timeRange: &GrafanaTimeRange{From: "now-0", To: "now"}, expected: "1h"},
		{title: "count without unit", timeRange: &GrafanaTimeRange{From: "now-5", To: "now"}, expected: "1h"},
		{title: "missing duration", timeRange: &GrafanaTimeRange{From: "now-", To: "now"}, expected: "1h"},
		{title: "unknown unit", timeRange: &GrafanaTimeRange{From: "now-6x", To: "now"}, expected: "1h"},
		{title: "implicit count with an unknown unit", timeRange: &GrafanaTimeRange{From: "now-x", To: "now"}, expected: "1h"},
		{title: "milliseconds, not supported by Grafana in a time range", timeRange: &GrafanaTimeRange{From: "now-500ms", To: "now"}, expected: "1h"},
		{title: "signed count", timeRange: &GrafanaTimeRange{From: "now-+6M", To: "now"}, expected: "1h"},
		{title: "count above 32 bits", timeRange: &GrafanaTimeRange{From: "now-614891469123651721M", To: "now"}, expected: "1h"},
		{title: "months out of range", timeRange: &GrafanaTimeRange{From: "now-3600M", To: "now"}, expected: "1h"},
		{title: "years out of range", timeRange: &GrafanaTimeRange{From: "now-1000y", To: "now"}, expected: "1h"},
	}
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.expected, migrateDuration(test.timeRange))
		})
	}
}

func TestMigrateRefreshInterval(t *testing.T) {
	tests := []struct {
		title    string
		refresh  string
		expected common.DurationString
	}{
		{title: "1 minute", refresh: "1m", expected: "1m"},
		{title: "5 seconds", refresh: "5s", expected: "5s"},
		{title: "1 hour", refresh: "1h", expected: "1h"},
		{title: "1 day", refresh: "1d", expected: "1d"},
		{title: "500 milliseconds", refresh: "500ms", expected: "500ms"},
		{title: "whitespace around the interval", refresh: " 30s ", expected: "30s"},
		{title: "milliseconds with whitespace", refresh: " 500ms ", expected: "500ms"},
		{title: "years are converted into days", refresh: "1y", expected: "365d"},
		{title: "months are converted into days", refresh: "1M", expected: "30d"},
		{title: "auto-refresh off", refresh: "", expected: ""},
		{title: "zero interval", refresh: "0s", expected: ""},
		{title: "zero without unit", refresh: "0", expected: ""},
		{title: "zero milliseconds", refresh: "0ms", expected: ""},
		{title: "auto", refresh: "auto", expected: ""},
		{title: "live", refresh: "LIVE", expected: ""},
		{title: "whitespace before the unit", refresh: "1 m", expected: ""},
		{title: "negative interval", refresh: "-1m", expected: ""},
		{title: "decimal count", refresh: "1.5m", expected: ""},
		{title: "out of range", refresh: "1000y", expected: ""},
		// Unlike a time range, a refresh interval needs a count in Grafana
		{title: "implicit count", refresh: "m", expected: ""},
		{title: "implicit count in milliseconds", refresh: "ms", expected: ""},
	}
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.expected, migrateRefreshInterval(test.refresh))
		})
	}
}

func TestMigrateTimezone(t *testing.T) {
	tests := []struct {
		title    string
		timezone string
		expected string
	}{
		{title: "default timezone", timezone: "", expected: ""},
		{title: "browser timezone", timezone: "browser", expected: ""},
		{title: "browser timezone, capitalized", timezone: "Browser", expected: ""},
		{title: "local timezone", timezone: "local", expected: ""},
		{title: "local timezone, capitalized", timezone: "Local", expected: ""},
		{title: "utc", timezone: "utc", expected: "UTC"},
		{title: "UTC", timezone: "UTC", expected: "UTC"},
		{title: "IANA timezone", timezone: "Europe/Paris", expected: "Europe/Paris"},
		{title: "IANA timezone with whitespace", timezone: " Europe/Paris ", expected: "Europe/Paris"},
		{title: "IANA timezone with an underscore", timezone: "America/New_York", expected: "America/New_York"},
		{title: "unknown timezone", timezone: "Not/AZone", expected: ""},
	}
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.expected, migrateTimezone(test.timezone))
		})
	}
}
