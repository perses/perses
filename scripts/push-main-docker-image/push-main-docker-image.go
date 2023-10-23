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
	"os/exec"
	"strings"

	"github.com/goreleaser/goreleaser/pkg/config"
	"github.com/perses/perses/internal/cli/file"
	"github.com/sirupsen/logrus"
)

const goreleaserFile = ".goreleaser.yaml"

func getCurrentBranch() string {
	branch, err := exec.Command("git", "branch", "--show-current").Output()
	if err != nil {
		logrus.WithError(err).Fatal("unable to get the current branch")
	}
	return strings.TrimSpace(string(branch))
}

func main() {
	if getCurrentBranch() != "main" {
		logrus.Warning("script has been executed on a branch different than the main branch")
		return
	}
	goreleaserConfig := &config.Project{}
	if err := file.Unmarshal(goreleaserFile, goreleaserConfig); err != nil {
		logrus.WithError(err).Fatal("unable to load the goreleaser config")
	}
	for _, dockerConfig := range goreleaserConfig.Dockers {
		for _, image := range dockerConfig.ImageTemplates {
			if _, err := exec.Command("docker", "push", image).Output(); err != nil {
				logrus.WithError(err).Fatalf("unable to push the docker image %q", image)
			}
		}
	}
	for _, manifestConfig := range goreleaserConfig.DockerManifests {
		args := []string{"manifest", "create", manifestConfig.NameTemplate}
		args = append(args, manifestConfig.ImageTemplates...)
		if _, err := exec.Command("docker", args...).Output(); err != nil {
			logrus.WithError(err).Fatalf("unable to create the docker manifest %q", manifestConfig.NameTemplate)
		}
		if _, err := exec.Command("docker", "push", manifestConfig.NameTemplate).Output(); err != nil {
			logrus.WithError(err).Fatalf("unable to push the docker manifest %q", manifestConfig.NameTemplate)
		}
	}
}
