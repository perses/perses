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
	"bufio"
	"bytes"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

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

func getPreviousTag() string {
	previousVersion, err := exec.Command("git", "describe", "--abbrev=0").Output()
	if err != nil {
		logrus.WithError(err).Fatal("unable to get the latest tag")
	}
	return strings.TrimSpace(string(previousVersion))
}

func getGitLogs(previousVersion string) []string {
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
	if catalogKind == KindToBeIgnored {
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

type changelog struct {
	features        []string
	enhancements    []string
	bugfixes        []string
	breakingChanges []string
	docs            []string
	unknown         []string
}

func newChangelog(entries []string) *changelog {
	clog := &changelog{}
	for _, entry := range entries {
		kindEntry, newEntry := parseAndFormatEntry(entry)
		switch kindEntry {
		case kindFeature:
			clog.features = append(clog.features, newEntry)
		case kindEnhancement:
			clog.enhancements = append(clog.enhancements, newEntry)
		case kindBugfix:
			clog.bugfixes = append(clog.bugfixes, newEntry)
		case kindBreakingChange:
			clog.breakingChanges = append(clog.breakingChanges, newEntry)
		case kindDoc:
			clog.docs = append(clog.docs, newEntry)
		case kindUnknown:
			clog.unknown = append(clog.unknown, newEntry)
		}
	}
	return clog
}

func injectEntries(buffer *bytes.Buffer, entries []string, catalogEntry string) {
	for _, entry := range entries {
		buffer.WriteString(fmt.Sprintf("- %s %s\n", formatChangelogCategory(catalogEntry), entry))
	}
}

func (c *changelog) generateChangelog(version string) string {
	now := time.Now()
	var buffer bytes.Buffer
	buffer.WriteString(fmt.Sprintf("## %s / %s\n\n", version, now.Format("2006-01-02")))
	injectEntries(&buffer, c.features, feature)
	injectEntries(&buffer, c.enhancements, enhancement)
	injectEntries(&buffer, c.bugfixes, bugfix)
	injectEntries(&buffer, c.breakingChanges, breakingChange)
	injectEntries(&buffer, c.docs, doc)
	if len(c.unknown) > 0 {
		buffer.WriteString("\n[//]: <UNKNOWN ENTRIES. Release shepherd, please review the following list and categorize them or remove them>\n\n")
		injectEntries(&buffer, c.unknown, unknown)
	}
	return buffer.String()
}

func (c *changelog) write(version string) {
	f, err := os.Open("CHANGELOG.md")
	if err != nil {
		logrus.WithError(err).Fatal("unable to open the file CHANGELOG.md")
	}
	fileScanner := bufio.NewScanner(f)
	fileScanner.Split(bufio.ScanLines)
	var buffer bytes.Buffer
	i := 0
	for fileScanner.Scan() {
		buffer.WriteString(fileScanner.Text())
		buffer.WriteString("\n")
		i++
		if i == 1 {
			// inject the new changelog entries after the title
			buffer.WriteString("\n")
			buffer.WriteString(c.generateChangelog(version))
		}
	}
	if closeErr := f.Close(); closeErr != nil {
		logrus.WithError(closeErr).Fatal("unable to close the file CHANGELOG.md")
	}
	if writeErr := os.WriteFile("CHANGELOG.md", buffer.Bytes(), 0600); writeErr != nil {
		logrus.WithError(writeErr).Fatal("unable to inject the new changelog entries in CHANGELOG.md")
	}
}

func main() {
	previousVersion := getPreviousTag()
	entries := getGitLogs(previousVersion)
	version := flag.String("version", "", "release version")
	flag.Parse()
	clog := newChangelog(entries)
	clog.write(*version)
}
