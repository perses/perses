// Copyright 2022 The Perses Authors
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
	"bytes"
	"flag"
	"fmt"
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
)

// kind represents the type of change.
type kind int

const (
	kindBreakingChange = iota
	kindFeature
	kindEnhancement
	kindBugfix
	KindToBeIgnored
)

func getPreviousTag() string {
	previousVersion, err := exec.Command("git", "describe", "--abbrev=0").Output()
	if err != nil {
		logrus.WithError(err).Fatal("unable to get the latest tag")
	}
	return strings.TrimSpace(string(previousVersion))
}

func getGitLogs(previousVersion string) []string {
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

func removeChangelogCategory(entry string, category string) string {
	return strings.ReplaceAll(entry, formatChangelogCategory(category), "")
}

func parseEntry(entry string) (kind, string) {
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
	if strings.Contains(newEntry, formatChangelogCategory(feature)) {
		newEntry = removeChangelogCategory(newEntry, feature)
		return kindFeature, newEntry
	} else if strings.Contains(newEntry, formatChangelogCategory(enhancement)) {
		newEntry = removeChangelogCategory(newEntry, enhancement)
		return kindEnhancement, newEntry
	} else if strings.Contains(newEntry, formatChangelogCategory(bugfix)) {
		newEntry = removeChangelogCategory(newEntry, bugfix)
		return kindBugfix, newEntry
	} else if strings.Contains(newEntry, formatChangelogCategory(breakingChange)) {
		newEntry = removeChangelogCategory(newEntry, breakingChange)
		return kindBreakingChange, newEntry
	}
	return KindToBeIgnored, ""
}

type changelog struct {
	features        []string
	enhancements    []string
	bugfixes        []string
	breakingChanges []string
}

func newChangelog(entries []string) *changelog {
	clog := &changelog{}
	for _, entry := range entries {
		kindEntry, newEntry := parseEntry(entry)
		switch kindEntry {
		case kindFeature:
			clog.features = append(clog.features, newEntry)
		case kindEnhancement:
			clog.enhancements = append(clog.enhancements, newEntry)
		case kindBugfix:
			clog.bugfixes = append(clog.bugfixes, newEntry)
		case kindBreakingChange:
			clog.breakingChanges = append(clog.breakingChanges, newEntry)
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
	buffer.WriteString(fmt.Sprintf("## %s / %s\n\n", version, now.Format("2022-12-06")))
	injectEntries(&buffer, c.features, feature)
	injectEntries(&buffer, c.enhancements, enhancement)
	injectEntries(&buffer, c.bugfixes, bugfix)
	injectEntries(&buffer, c.breakingChanges, breakingChange)
	return buffer.String()
}

func (c *changelog) write(version string) {
	generatedChangelog := c.generateChangelog(version)
}

func main() {
	previousVersion := getPreviousTag()
	entries := getGitLogs(previousVersion)
	version := flag.String("version", "", "release version")
	flag.Parse()
	clog := newChangelog(entries)
	clog.write(*version)
}
