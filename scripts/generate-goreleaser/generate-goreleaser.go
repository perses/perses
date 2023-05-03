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
	_ "embed"
	"fmt"
	"os"
	"strings"

	"github.com/goreleaser/goreleaser/pkg/config"
	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v2"
)

const dockerBaseImageTemplateName = "docker.io/persesdev/perses"

//go:embed .goreleaser.base.yaml
var baseConfig []byte
var (
	dockerSupportedArches            = []string{"amd64", "arm64"}
	mapDockerfileNameAndTemplateName = map[string][]string{
		"Dockerfile":                  {"", "distroless"},
		"distroless-debug.Dockerfile": {"debug", "distroless-debug"},
	}
)

func join(elems []string, sep string) string {
	var sb strings.Builder
	for i := 0; i < len(elems); i++ {
		el := elems[i]
		if len(el) == 0 {
			continue
		}
		sb.WriteString(el)
		if i < len(elems)-1 {
			nextEl := elems[i+1]
			if len(nextEl) == 0 {
				continue
			}
			sb.WriteString(sep)
		}
	}
	return sb.String()
}

func readGoreleaserBaseFile() *config.Project {
	c := &config.Project{}
	if err := yaml.Unmarshal(baseConfig, c); err != nil {
		logrus.Fatal(err)
	}
	return c
}

func generateDockerConfig(c *config.Project) {
	var binaryIDs []string
	for _, build := range c.Builds {
		binaryIDs = append(binaryIDs, build.ID)
	}
	for dockerfileName, templateNames := range mapDockerfileNameAndTemplateName {
		for _, arch := range dockerSupportedArches {
			c.Dockers = append(c.Dockers, config.Docker{
				Goos:       "linux",
				Goarch:     arch,
				IDs:        binaryIDs,
				Dockerfile: dockerfileName,
				ImageTemplates: []string{
					fmt.Sprintf("%s:{{ .Tag }}-%s-%s", dockerBaseImageTemplateName, templateNames[1], arch),
				},
				BuildFlagTemplates: []string{
					"--pull",
					"--label=org.opencontainers.image.authors=The Perses Authors <perses-team@googlegroups.com>",
					"--label=org.opencontainers.image.title={{ .ProjectName }}",
					"--label=org.opencontainers.image.description={{ .ProjectName }}",
					"--label=org.opencontainers.image.url=https://github.com/perses/perses",
					"--label=org.opencontainers.image.source=https://github.com/perses/perses",
					"--label=org.opencontainers.image.version={{ .Version }}",
					"--label=org.opencontainers.image.created={{ .Date }}",
					"--label=org.opencontainers.image.revision={{ .FullCommit }}",
					"--label=org.opencontainers.image.licenses=Apache-2.0",
					fmt.Sprintf("--platform=linux/%s", arch),
				},
				Files: []string{
					"LICENSE",
					"schemas/",
					"cue.mod/",
					"docs/examples/config.docker.yaml",
				},
			})
		}
	}
}

func generateDockerManifest(c *config.Project) {
	for _, templateNames := range mapDockerfileNameAndTemplateName {
		var imageTemplate []string
		for _, arch := range dockerSupportedArches {
			imageTemplate = append(imageTemplate, fmt.Sprintf("%s:{{ .Tag }}-%s-%s", dockerBaseImageTemplateName, templateNames[1], arch))
		}
		c.DockerManifests = append(c.DockerManifests,
			config.DockerManifest{
				NameTemplate:   fmt.Sprintf("%s:%s", dockerBaseImageTemplateName, join([]string{"latest", templateNames[0]}, "-")),
				ImageTemplates: imageTemplate,
			})
		for _, templateName := range templateNames {
			c.DockerManifests = append(c.DockerManifests,
				config.DockerManifest{
					NameTemplate:   fmt.Sprintf("%s:%s", dockerBaseImageTemplateName, join([]string{"{{ .Tag }}", templateName}, "-")),
					ImageTemplates: imageTemplate,
				},
				config.DockerManifest{
					NameTemplate:   fmt.Sprintf("%s:%s", dockerBaseImageTemplateName, join([]string{"v{{ .Major }}.{{ .Minor }}", templateName}, "-")),
					ImageTemplates: imageTemplate,
				})
		}

	}
}

func main() {
	c := readGoreleaserBaseFile()
	generateDockerConfig(c)
	generateDockerManifest(c)
	data, err := yaml.Marshal(c)
	if err != nil {
		logrus.Fatal(err)
	}
	if writeErr := os.WriteFile(".goreleaser.yaml", data, 0600); writeErr != nil {
		logrus.Fatal(writeErr)
	}
}
