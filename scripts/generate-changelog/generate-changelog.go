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
	"flag"
	"os"

	"github.com/prometheus/promu/pkg/changelog"
	"github.com/sirupsen/logrus"
)

func main() {
	version := flag.String("version", "", "release version")
	flag.Parse()
	f, err := os.Open("CHANGELOG.md")
	if err != nil {
		logrus.Fatal(err)
	}
	defer f.Close()
	entry, err := changelog.ReadEntry(f, *version)
	if err != nil {
		logrus.WithError(err).Fatalf("unable to get the entry in the changelog for the version %q", *version)
	}
	err = os.WriteFile("GENERATED_CHANGELOG.md", []byte(entry.Text), 0600)
	if err != nil {
		logrus.WithError(err).Fatal("error when generating the changelog")
	}
}
