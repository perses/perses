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
	"flag"
	"os/exec"
	"strings"

	"github.com/perses/perses/scripts/pkg/changelog"
	"github.com/sirupsen/logrus"
)

func getPreviousTag() string {
	// We cannot use the package command from scripts/pkg/command/command.go because it sets the output to os.Stdout while the function Output() needs to capture it.
	// And somehow, you cannot set twice the output of a command.
	previousVersion, err := exec.Command("git", "describe", "--abbrev=0").Output()
	if err != nil {
		logrus.WithError(err).Fatal("unable to get the latest tag")
	}
	return strings.TrimSpace(string(previousVersion))
}

func main() {
	previousVersion := getPreviousTag()
	entries := changelog.GetGitLogs(previousVersion)
	version := flag.String("version", "", "release version")
	flag.Parse()
	clog := changelog.New(entries)
	changelog.Write(clog, *version)
}
