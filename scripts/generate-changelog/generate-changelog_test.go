// Copyright 2025 The Perses Authors
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

	"github.com/perses/perses/scripts/changelog"
	"github.com/stretchr/testify/assert"
)

func TestGenerateChangelog(t *testing.T) {
	now := time.Now()
	title := fmt.Sprintf("## 0.20.0 / %s", now.Format("2006-01-02"))
	testSuite := []struct {
		title    string
		clog     *changelog.Changelog
		expected string
	}{
		{
			title:    "empty changelog",
			clog:     &changelog.Changelog{},
			expected: fmt.Sprintf("%s\n%s\n", title, ""),
		},
		{
			title: "changelog with every entry",
			clog: &changelog.Changelog{
				Features: []string{"Discard Changes Confirmation Dialog (#834)"},
				Enhancements: []string{"Variable UX fixes (#842)",
					"legend options editor UX improvements (#845)",
					"Make it possible to adjust the height of the time range controls (#829)",
				},
				BugFixes:        []string{"Fix time units display, allow decimalPlaces to be used (#837)"},
				BreakingChanges: []string{"legend.position now required in time series panel (#848)"},
				Docs:            []string{"Complete documentation about the API. (#1471) (##1479) (##1483) (#1490) (#1491) (#1500)"},
				Unknown:         []string{"Use exact versions for internal npm dependencies (#846)", "Support snapshot UI releases (#844)"},
			},
			expected: fmt.Sprintf("%s\n%s", title, `
- [FEATURE] Discard Changes Confirmation Dialog (#834)
- [ENHANCEMENT] Variable UX fixes (#842)
- [ENHANCEMENT] legend options editor UX improvements (#845)
- [ENHANCEMENT] Make it possible to adjust the height of the time range controls (#829)
- [BUGFIX] Fix time units display, allow decimalPlaces to be used (#837)
- [BREAKINGCHANGE] legend.position now required in time series panel (#848)
- [DOC] Complete documentation about the API. (#1471) (##1479) (##1483) (#1490) (#1491) (#1500)

[//]: <UNKNOWN ENTRIES. Release shepherd, please review the following list and categorize them or remove them>

- [UNKNOWN] Use exact versions for internal npm dependencies (#846)
- [UNKNOWN] Support snapshot UI releases (#844)
`),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.expected, generateChangelog(test.clog, "0.20.0"))
		})
	}
}
