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
	"bufio"
	"bytes"
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

const (
	gitLogFieldSeparator  = "\x00"
	gitLogRecordSeparator = "\x1e"
	gitLogFormat          = "--pretty=format:%h%x00%P%x00%s%x00%b%x1e"
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

type gitLogEntry struct {
	hash    string
	parents string
	subject string
	body    string
}

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

func mergePullRequestNumber(subject string) (string, bool) {
	const prefix = "merge pull request #"
	lowerSubject := strings.ToLower(subject)
	if !strings.HasPrefix(lowerSubject, prefix) {
		return "", false
	}
	rest := subject[len(prefix):]
	end := 0
	for _, r := range rest {
		if r < '0' || r > '9' {
			break
		}
		end++
	}
	if end == 0 {
		return "", false
	}
	return rest[:end], true
}

func firstNonEmptyLine(text string) string {
	for _, line := range strings.Split(text, "\n") {
		if trimmedLine := strings.TrimSpace(line); trimmedLine != "" {
			return trimmedLine
		}
	}
	return ""
}

func formatGitLogEntry(hash, subject, body string) string {
	message := subject
	if number, ok := mergePullRequestNumber(subject); ok {
		if title := firstNonEmptyLine(body); title != "" {
			message = title
			if !strings.Contains(message, fmt.Sprintf("(#%s)", number)) {
				message = fmt.Sprintf("%s (#%s)", message, number)
			}
		}
	}
	return fmt.Sprintf("%s %s", hash, message)
}

func (g gitLogEntry) raw() string {
	return fmt.Sprintf("%s %s", g.hash, g.subject)
}

func (g gitLogEntry) pullRequestEntry() string {
	return formatGitLogEntry(g.hash, g.subject, g.body)
}

func parseGitLogEntries(gitLogs []byte) []gitLogEntry {
	records := strings.Split(string(gitLogs), gitLogRecordSeparator)
	entries := make([]gitLogEntry, 0, len(records))
	for _, record := range records {
		record = strings.Trim(record, "\n")
		if strings.TrimSpace(record) == "" {
			continue
		}
		fields := strings.SplitN(record, gitLogFieldSeparator, 4)
		if len(fields) < 4 {
			continue
		}
		entries = append(entries, gitLogEntry{
			hash:    fields[0],
			parents: fields[1],
			subject: fields[2],
			body:    fields[3],
		})
	}
	return entries
}

func getGitLogEntries(revisionRange string) []gitLogEntry {
	// nolint: gosec
	gitLogs, err := exec.Command("git", "log", revisionRange, gitLogFormat, "--no-decorate").Output()
	if err != nil {
		logrus.WithError(err).Fatal("unable to get the git logs")
	}
	return parseGitLogEntries(gitLogs)
}

func shouldGroupPullRequest(mergeEntry gitLogEntry, pullRequestEntries []gitLogEntry) bool {
	mergeKind, _ := parseAndFormatEntry(mergeEntry.pullRequestEntry())
	if mergeKind == kindUnknown || mergeKind == KindToBeIgnored {
		return false
	}
	for _, entry := range pullRequestEntries {
		entryKind, _ := parseAndFormatEntry(entry.raw())
		if entryKind == KindToBeIgnored || entryKind == kindUnknown {
			continue
		}
		if entryKind != mergeKind {
			return false
		}
	}
	return true
}

func groupPullRequestEntries(gitLogEntries []gitLogEntry, getPullRequestEntries func(string) []gitLogEntry) []string {
	groupedCommits := map[string]struct{}{}
	groupedMergeEntries := map[string]string{}
	for _, entry := range gitLogEntries {
		if _, ok := mergePullRequestNumber(entry.subject); !ok {
			continue
		}
		parents := strings.Fields(entry.parents)
		if len(parents) < 2 {
			continue
		}
		pullRequestEntries := getPullRequestEntries(fmt.Sprintf("%s..%s", parents[0], parents[1]))
		if !shouldGroupPullRequest(entry, pullRequestEntries) {
			continue
		}
		groupedMergeEntries[entry.hash] = entry.pullRequestEntry()
		for _, pullRequestEntry := range pullRequestEntries {
			groupedCommits[pullRequestEntry.hash] = struct{}{}
		}
	}

	entries := make([]string, 0, len(gitLogEntries))
	for _, entry := range gitLogEntries {
		if _, ok := groupedCommits[entry.hash]; ok {
			continue
		}
		if groupedEntry, ok := groupedMergeEntries[entry.hash]; ok {
			entries = append(entries, groupedEntry)
			continue
		}
		entries = append(entries, entry.raw())
	}
	return entries
}

func InjectEntries(buffer *bytes.Buffer, entries []string, catalogEntry string) {
	for _, entry := range entries {
		buffer.WriteString(fmt.Sprintf("- %s %s\n", formatChangelogCategory(catalogEntry), entry)) //nolint: staticcheck
	}
}

func GetGitLogs(previousVersion string) []string {
	gitLogEntries := getGitLogEntries(fmt.Sprintf("%s...HEAD", previousVersion))
	return groupPullRequestEntries(gitLogEntries, getGitLogEntries)
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

func generateChangelog(clog *Changelog, version string) string {
	now := time.Now()
	var buffer bytes.Buffer
	_, _ = fmt.Fprintf(&buffer, "## %s / %s\n\n", version, now.Format("2006-01-02"))
	buffer.WriteString(clog.GenerateChangelog())
	if len(clog.Unknown) > 0 {
		buffer.WriteString("\n[//]: <UNKNOWN ENTRIES. Release shepherd, please review the following list and categorize them or remove them>\n\n")
		InjectEntries(&buffer, clog.Unknown, "UNKNOWN")
	}
	return buffer.String()
}

func Write(clog *Changelog, version string) {
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
			buffer.WriteString(generateChangelog(clog, version))
		}
	}
	if closeErr := f.Close(); closeErr != nil {
		logrus.WithError(closeErr).Fatal("unable to close the file CHANGELOG.md")
	}
	if writeErr := os.WriteFile("CHANGELOG.md", buffer.Bytes(), 0600); writeErr != nil {
		logrus.WithError(writeErr).Fatal("unable to inject the new changelog entries in CHANGELOG.md")
	}
}
