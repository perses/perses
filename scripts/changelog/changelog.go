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

package changelog

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"

	"github.com/sirupsen/logrus"
)

const (
	feature        = "FEATURE"
	enhancement    = "ENHANCEMENT"
	bugfix         = "BUGFIX"
	breakingChange = "BREAKINGCHANGE"
	unknown        = "UNKNOWN"
	ignore         = "IGNORE"
	doc            = "DOC"
)

// kind represents the type of change.
type kind int

const (
	kindBreakingChange = iota
	kindFeature
	kindEnhancement
	kindBugfix
	kindUnknown
	KindToBeIgnored
	kindDoc
)

func getStringInBetweenTwoString(str string, startS string, endS string) (result string, found bool) {
	s := strings.Index(str, startS)
	if s == -1 {
		return result, false
	}
	newS := str[s+len(startS):]
	e := strings.Index(newS, endS)
	if e == -1 {
		return result, false
	}
	result = newS[:e]
	return result, true
}

func formatChangelogCategory(category string) string {
	return fmt.Sprintf("[%s]", category)
}

// parseCatalogEntry returns the catalog kind and the catalog entry found.
func parseCatalogEntry(entry string) (kind, string) {
	catalog, found := getStringInBetweenTwoString(entry, "[", "]")
	if !found {
		return kindUnknown, ""
	}
	switch strings.ToUpper(catalog) {
	case feature:
		return kindFeature, catalog
	case enhancement:
		return kindEnhancement, catalog
	case bugfix:
		return kindBugfix, catalog
	case breakingChange:
		return kindBreakingChange, catalog
	case ignore:
		return KindToBeIgnored, ""
	case doc:
		return kindDoc, catalog
	default:
		return kindUnknown, ""
	}
}

func ignoreEntry(entry string) bool {
	lowerEntry := strings.ToLower(entry)
	return strings.HasPrefix(lowerEntry, "merge branch") ||
		strings.HasPrefix(lowerEntry, "merge pull request") ||
		strings.HasPrefix(lowerEntry, "release") ||
		strings.HasPrefix(lowerEntry, "sync release") ||
		strings.HasPrefix(lowerEntry, "bump")
}

// parseAndFormatEntry will extract the commit message and detect what is the catalog entry
func parseAndFormatEntry(entry string) (kind, string) {
	// remove commit ID
	entryAsRune := []rune(entry)
	newEntry := entry
	for i, r := range entryAsRune {
		if r == ' ' {
			newEntry = entry[i+1:]
			break
		}
	}
	// extract catalog entry and remove it to get a cleaner message
	catalogKind, catalogEntry := parseCatalogEntry(newEntry)
	if catalogKind == KindToBeIgnored { // nolint: staticcheck
		return KindToBeIgnored, ""
	} else if catalogKind == kindUnknown {
		// list of exception that would make the commit ignored
		if ignoreEntry(newEntry) {
			return KindToBeIgnored, ""
		}
		return kindUnknown, newEntry
	}
	return catalogKind, strings.TrimSpace(strings.ReplaceAll(newEntry, fmt.Sprintf("[%s]", catalogEntry), ""))
}

func InjectEntries(buffer *bytes.Buffer, entries []string, catalogEntry string) {
	for _, entry := range entries {
		buffer.WriteString(fmt.Sprintf("- %s %s\n", formatChangelogCategory(catalogEntry), entry)) //nolint: staticcheck
	}
}

func GetGitLogs(previousVersion string) []string {
	// nolint: gosec
	gitLogs, err := exec.Command("git", "log", fmt.Sprintf("%s...HEAD", previousVersion), "--pretty=oneline", "--no-decorate").Output()
	if err != nil {
		logrus.WithError(err).Fatal("unable to get the git logs")
	}
	entries := strings.Split(string(gitLogs), "\n")
	if lastLine := entries[len(entries)-1]; strings.TrimSpace(lastLine) == "" {
		entries = entries[0 : len(entries)-1]
	}
	return entries
}

type Changelog struct {
	Features        []string
	Enhancements    []string
	BugFixes        []string
	BreakingChanges []string
	Docs            []string
	Unknown         []string
}

func New(entries []string) *Changelog {
	clog := &Changelog{}
	for _, entry := range entries {
		kindEntry, newEntry := parseAndFormatEntry(entry)
		switch kindEntry {
		case kindFeature:
			clog.Features = append(clog.Features, newEntry)
		case kindEnhancement:
			clog.Enhancements = append(clog.Enhancements, newEntry)
		case kindBugfix:
			clog.BugFixes = append(clog.BugFixes, newEntry)
		case kindBreakingChange:
			clog.BreakingChanges = append(clog.BreakingChanges, newEntry)
		case kindDoc:
			clog.Docs = append(clog.Docs, newEntry)
		case kindUnknown:
			clog.Unknown = append(clog.Unknown, newEntry)
		}
	}
	return clog
}

func (c *Changelog) GenerateChangelog() string {
	var buffer bytes.Buffer
	InjectEntries(&buffer, c.Features, feature)
	InjectEntries(&buffer, c.Enhancements, enhancement)
	InjectEntries(&buffer, c.BugFixes, bugfix)
	InjectEntries(&buffer, c.BreakingChanges, breakingChange)
	InjectEntries(&buffer, c.Docs, doc)
	return buffer.String()
}
