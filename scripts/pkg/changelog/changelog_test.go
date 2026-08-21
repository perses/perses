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

package changelog

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
			title:                "doc catalog entry",
			entry:                "[DOC] commit message",
			expectedKind:         kindDoc,
			expectedCatalogEntry: "DOC",
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

func TestFormatGitLogEntry(t *testing.T) {
	testSuite := []struct {
		title    string
		hash     string
		subject  string
		body     string
		expected string
	}{
		{
			title:    "commit entry is unchanged",
			hash:     "f19355e87558177e6ad77d45bdd070fe99d62db6",
			subject:  "[ENHANCEMENT] visual options and reset btn ux feedback (#850)",
			expected: "f19355e87558177e6ad77d45bdd070fe99d62db6 [ENHANCEMENT] visual options and reset btn ux feedback (#850)",
		},
		{
			title:   "merge pull request uses body title",
			hash:    "6efcbec6538cec7bb674510ade1657a8f0292b24",
			subject: "Merge pull request #439 from contributor/feat/bump-perses-0.54.0",
			body: `[FEATURE] update perses dependency to v0.54.0

Additional context.`,
			expected: "6efcbec6538cec7bb674510ade1657a8f0292b24 [FEATURE] update perses dependency to v0.54.0 (#439)",
		},
		{
			title:    "merge pull request does not duplicate PR number",
			hash:     "28b82ced25c856799594bea0c733bede85bca18a",
			subject:  "Merge pull request #456 from contributor/add-priority-class-name",
			body:     "[FEATURE] add priorityClassName to Perses spec (#456)",
			expected: "28b82ced25c856799594bea0c733bede85bca18a [FEATURE] add priorityClassName to Perses spec (#456)",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.expected, formatGitLogEntry(test.hash, test.subject, test.body))
		})
	}
}

func TestMergePullRequestNumber(t *testing.T) {
	testSuite := []struct {
		title          string
		subject        string
		expectedNumber string
		expectedFound  bool
	}{
		{
			title:          "GitHub merge commit",
			subject:        "Merge pull request #428 from contributor/metrics-label",
			expectedNumber: "428",
			expectedFound:  true,
		},
		{
			title:          "case insensitive",
			subject:        "merge pull request #456 from contributor/add-priority-class-name",
			expectedNumber: "456",
			expectedFound:  true,
		},
		{
			title:         "missing pull request number",
			subject:       "Merge pull request # from repository/feature",
			expectedFound: false,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			number, found := mergePullRequestNumber(test.subject)
			assert.Equal(t, test.expectedNumber, number)
			assert.Equal(t, test.expectedFound, found)
		})
	}
}

func TestParseGitLogEntries(t *testing.T) {
	gitLogs := []byte("ad29ece\x00base head\x00Merge pull request #428 from contributor/metrics-label\x00[ENHANCEMENT] Use specific reason labels in reconciliation error metrics\n\nAdditional context.\x1e")

	assert.Equal(t, []gitLogEntry{
		{
			hash:    "ad29ece",
			parents: "base head",
			subject: "Merge pull request #428 from contributor/metrics-label",
			body: `[ENHANCEMENT] Use specific reason labels in reconciliation error metrics

Additional context.`,
		},
	}, parseGitLogEntries(gitLogs))
}

func TestGroupPullRequestEntries(t *testing.T) {
	testSuite := []struct {
		title              string
		gitLogEntries      []gitLogEntry
		pullRequestEntries []gitLogEntry
		expectedEntries    []string
		expectedChangelog  *Changelog
	}{
		{
			title: "single kind PR is represented by its title",
			gitLogEntries: []gitLogEntry{
				{
					hash:    "ad29ece08bb51cafa80df458ba0c79bc8f7ebaf9",
					parents: "base head",
					subject: "Merge pull request #428 from contributor/metrics-label",
					body:    "[ENHANCEMENT] Use specific reason labels in reconciliation error metrics",
				},
				{
					hash:    "15dd438928adc01edc8d116f25bd5bcef10203f6",
					subject: "[ENHANCEMENT] Add promtool to managed tools and run alert tests in CI",
				},
				{
					hash:    "e8d54754549de7d1dcf7f90da6094b9d56ab7804",
					subject: "[ENHANCEMENT Use specific reason labels in reconciliation error metrics",
				},
			},
			pullRequestEntries: []gitLogEntry{
				{
					hash:    "15dd438928adc01edc8d116f25bd5bcef10203f6",
					subject: "[ENHANCEMENT] Add promtool to managed tools and run alert tests in CI",
				},
				{
					hash:    "e8d54754549de7d1dcf7f90da6094b9d56ab7804",
					subject: "[ENHANCEMENT Use specific reason labels in reconciliation error metrics",
				},
			},
			expectedEntries: []string{
				"ad29ece08bb51cafa80df458ba0c79bc8f7ebaf9 [ENHANCEMENT] Use specific reason labels in reconciliation error metrics (#428)",
			},
			expectedChangelog: &Changelog{
				Enhancements: []string{"Use specific reason labels in reconciliation error metrics (#428)"},
			},
		},
		{
			title: "multi kind PR retains its commit entries",
			gitLogEntries: []gitLogEntry{
				{
					hash:    "6efcbec6538cec7bb674510ade1657a8f0292b24",
					parents: "base head",
					subject: "Merge pull request #439 from repository/multi-kind",
					body:    "[FEATURE] Add mixed changes",
				},
				{
					hash:    "1b4e5f19c48b1a260749a047efb844a0d6af7b5d",
					subject: "[FEATURE] Add user-facing feature",
				},
				{
					hash:    "2348638d368dceda261775ff72badc74c56649b1",
					subject: "[BUGFIX] Fix related behavior",
				},
			},
			pullRequestEntries: []gitLogEntry{
				{
					hash:    "1b4e5f19c48b1a260749a047efb844a0d6af7b5d",
					subject: "[FEATURE] Add user-facing feature",
				},
				{
					hash:    "2348638d368dceda261775ff72badc74c56649b1",
					subject: "[BUGFIX] Fix related behavior",
				},
			},
			expectedEntries: []string{
				"6efcbec6538cec7bb674510ade1657a8f0292b24 Merge pull request #439 from repository/multi-kind",
				"1b4e5f19c48b1a260749a047efb844a0d6af7b5d [FEATURE] Add user-facing feature",
				"2348638d368dceda261775ff72badc74c56649b1 [BUGFIX] Fix related behavior",
			},
			expectedChangelog: &Changelog{
				Features: []string{"Add user-facing feature"},
				BugFixes: []string{"Fix related behavior"},
			},
		},
		{
			title: "uncategorized merge retains existing ignore behavior",
			gitLogEntries: []gitLogEntry{
				{
					hash:    "9b35947a2e3ed969dae2cbd0e248096305249c57",
					parents: "base head",
					subject: "Merge pull request #4323 from repository/release/v0.54",
					body:    "Merge back release v0.54.0 to main",
				},
				{
					hash:    "1b4e5f19c48b1a260749a047efb844a0d6af7b5d",
					subject: "[FEATURE] Add user-facing feature",
				},
			},
			pullRequestEntries: []gitLogEntry{
				{
					hash:    "1b4e5f19c48b1a260749a047efb844a0d6af7b5d",
					subject: "[FEATURE] Add user-facing feature",
				},
			},
			expectedEntries: []string{
				"9b35947a2e3ed969dae2cbd0e248096305249c57 Merge pull request #4323 from repository/release/v0.54",
				"1b4e5f19c48b1a260749a047efb844a0d6af7b5d [FEATURE] Add user-facing feature",
			},
			expectedChangelog: &Changelog{
				Features: []string{"Add user-facing feature"},
			},
		},
		{
			title: "merge without a body retains existing ignore behavior",
			gitLogEntries: []gitLogEntry{
				{
					hash:    "b5c64544efc4e4c71e0e6853de70d334a806a522",
					parents: "base head",
					subject: "Merge pull request #4324 from repository/feature",
				},
				{
					hash:    "1b4e5f19c48b1a260749a047efb844a0d6af7b5d",
					subject: "[FEATURE] Add user-facing feature",
				},
			},
			pullRequestEntries: []gitLogEntry{
				{
					hash:    "1b4e5f19c48b1a260749a047efb844a0d6af7b5d",
					subject: "[FEATURE] Add user-facing feature",
				},
			},
			expectedEntries: []string{
				"b5c64544efc4e4c71e0e6853de70d334a806a522 Merge pull request #4324 from repository/feature",
				"1b4e5f19c48b1a260749a047efb844a0d6af7b5d [FEATURE] Add user-facing feature",
			},
			expectedChangelog: &Changelog{
				Features: []string{"Add user-facing feature"},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			entries := groupPullRequestEntries(test.gitLogEntries, func(string) []gitLogEntry {
				return test.pullRequestEntries
			})
			assert.Equal(t, test.expectedEntries, entries)
			assert.Equal(t, test.expectedChangelog, New(entries))
		})
	}
}

func TestGenerateChangelog(t *testing.T) {
	now := time.Now()
	title := fmt.Sprintf("## 0.20.0 / %s", now.Format("2006-01-02"))
	testSuite := []struct {
		title    string
		clog     *Changelog
		expected string
	}{
		{
			title:    "empty changelog",
			clog:     &Changelog{},
			expected: fmt.Sprintf("%s\n%s\n", title, ""),
		},
		{
			title: "changelog with every entry",
			clog: &Changelog{
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
