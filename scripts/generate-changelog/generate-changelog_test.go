// Copyright 2023 The Perses Authors
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

package main

import (
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestParseCatalogEntry(t *testing.T) {
	testSuite := []struct {
		title                string
		entry                string
		expectedKind         kind
		expectedCatalogEntry string
	}{
		{
			title:                "no catalog entry",
			entry:                "a commit message without a catalog entry",
			expectedKind:         kindUnknown,
			expectedCatalogEntry: "",
		},
		{
			title:                "explicit ignore catalog entry",
			entry:                "[IGNORE] my awesome commit message",
			expectedKind:         KindToBeIgnored,
			expectedCatalogEntry: "",
		},
		{
			title:                "feature catalog entry",
			entry:                "[FEATURE] commit message",
			expectedKind:         kindFeature,
			expectedCatalogEntry: "FEATURE",
		},
		{
			title:                "enhancement catalog entry",
			entry:                "[ENHANCEMENT] another commit message",
			expectedKind:         kindEnhancement,
			expectedCatalogEntry: "ENHANCEMENT",
		},
		{
			title:                "breakingChange catalog entry",
			entry:                "[BREAKINGCHANGE] commit message",
			expectedKind:         kindBreakingChange,
			expectedCatalogEntry: "BREAKINGCHANGE",
		},
		{
			title:                "bugFix catalog entry",
			entry:                "[BUGFIX] commit message",
			expectedKind:         kindBugfix,
			expectedCatalogEntry: "BUGFIX",
		},
		{
			title:                "catalog entry with different case (1)",
			entry:                "[Feature] commit message",
			expectedKind:         kindFeature,
			expectedCatalogEntry: "Feature",
		},
		{
			title:                "catalog entry with different case (2)",
			entry:                "[BugFix] commit message",
			expectedKind:         kindBugfix,
			expectedCatalogEntry: "BugFix",
		},
		{
			title:                "catalog entry at the end of the commit",
			entry:                "commit message [BreakingChange]",
			expectedKind:         kindBreakingChange,
			expectedCatalogEntry: "BreakingChange",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			kindEntry, newEntry := parseCatalogEntry(test.entry)
			assert.Equal(t, test.expectedKind, kindEntry)
			assert.Equal(t, test.expectedCatalogEntry, newEntry)
		})
	}
}

func TestParseAndFormatEntry(t *testing.T) {
	testSuite := []struct {
		title         string
		entry         string
		expectedKind  kind
		expectedEntry string
	}{
		{
			title:         "unknown catalog",
			entry:         "b75e042daac589548d85ead05a9ef47fa0e62df0 add a way to generate the changelog entries",
			expectedKind:  kindUnknown,
			expectedEntry: "add a way to generate the changelog entries",
		},
		{
			title:         "merge commit is ignored (1)",
			entry:         "a6918dc9bdfb7e8a50dde0eba2d1ea9f45193086 Merge pull request #843 from perses/release/v0.20",
			expectedKind:  KindToBeIgnored,
			expectedEntry: "",
		},
		{
			title:         "merge commit is ignored (2)",
			entry:         "21771bce89849b46b6dc938e9983e49a3dc9eb07 Merge branch 'main' into release/v0.20",
			expectedKind:  KindToBeIgnored,
			expectedEntry: "",
		},
		{
			title:         "release commit is ignored",
			entry:         "944ef44d198f368e784d6239469a60a9212a4dca Release v0.20.0 (#839)",
			expectedKind:  KindToBeIgnored,
			expectedEntry: "",
		},
		{
			title:         "commit message extracted and formatted (1)",
			entry:         "f19355e87558177e6ad77d45bdd070fe99d62db6 [ENHANCEMENT] visual options and reset btn ux feedback (#850)",
			expectedKind:  kindEnhancement,
			expectedEntry: "visual options and reset btn ux feedback (#850)",
		},
		{
			title:         "commit message extracted and formatted (2)",
			entry:         "fa2e023d2bc2e2f5682141026133bcdf4960794f legend.position now required in time series panel [BreakingChange] (#848)",
			expectedKind:  kindBreakingChange,
			expectedEntry: "legend.position now required in time series panel  (#848)",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			kindEntry, newEntry := parseAndFormatEntry(test.entry)
			assert.Equal(t, test.expectedKind, kindEntry)
			assert.Equal(t, test.expectedEntry, newEntry)
		})
	}
}

func TestGenerateChangelog(t *testing.T) {
	now := time.Now()
	title := fmt.Sprintf("## 0.20.0 / %s", now.Format("2006-01-02"))
	testSuite := []struct {
		title    string
		clog     *changelog
		expected string
	}{
		{
			title:    "empty changelog",
			clog:     &changelog{},
			expected: fmt.Sprintf("%s\n%s\n", title, ""),
		},
		{
			title: "changelog with every entry",
			clog: &changelog{
				features: []string{"Discard Changes Confirmation Dialog (#834)"},
				enhancements: []string{"Variable UX fixes (#842)",
					"legend options editor UX improvements (#845)",
					"Make it possible to adjust the height of the time range controls (#829)",
				},
				bugfixes:        []string{"Fix time units display, allow decimal_places to be used (#837)"},
				breakingChanges: []string{"legend.position now required in time series panel (#848)"},
				unknown:         []string{"Use exact versions for internal npm dependencies (#846)", "Support snapshot UI releases (#844)"},
			},
			expected: fmt.Sprintf("%s\n%s", title, `
- [FEATURE] Discard Changes Confirmation Dialog (#834)
- [ENHANCEMENT] Variable UX fixes (#842)
- [ENHANCEMENT] legend options editor UX improvements (#845)
- [ENHANCEMENT] Make it possible to adjust the height of the time range controls (#829)
- [BUGFIX] Fix time units display, allow decimal_places to be used (#837)
- [BREAKINGCHANGE] legend.position now required in time series panel (#848)

[//]: <UNKNOWN ENTRIES. Release shepherd, please review the following list and categorize them or remove them>

- [UNKNOWN] Use exact versions for internal npm dependencies (#846)
- [UNKNOWN] Support snapshot UI releases (#844)
`),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.expected, test.clog.generateChangelog("0.20.0"))
		})
	}
}
