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

	"github.com/perses/perses/scripts/changelog"
	"github.com/sirupsen/logrus"
)

func getPreviousTag() string {
	previousVersion, err := exec.Command("git", "describe", "--abbrev=0").Output()
	if err != nil {
		logrus.WithError(err).Fatal("unable to get the latest tag")
	}
	return strings.TrimSpace(string(previousVersion))
}

func generateChangelog(clog *changelog.Changelog, version string) string {
	now := time.Now()
	var buffer bytes.Buffer
	buffer.WriteString(fmt.Sprintf("## %s / %s\n\n", version, now.Format("2006-01-02")))
	buffer.WriteString(clog.GenerateChangelog())
	if len(clog.Unknown) > 0 {
		buffer.WriteString("\n[//]: <UNKNOWN ENTRIES. Release shepherd, please review the following list and categorize them or remove them>\n\n")
		changelog.InjectEntries(&buffer, clog.Unknown, "UNKNOWN")
	}
	return buffer.String()
}

func Write(clog *changelog.Changelog, version string) {
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

func main() {
	previousVersion := getPreviousTag()
	entries := changelog.GetGitLogs(previousVersion)
	version := flag.String("version", "", "release version")
	flag.Parse()
	clog := changelog.New(entries)
	Write(clog, *version)
}
