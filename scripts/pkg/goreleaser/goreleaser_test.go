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

package goreleaser

import (
	"path/filepath"
	"testing"

	"github.com/goreleaser/goreleaser/v2/pkg/config"
	"github.com/perses/perses/internal/cli/file"
	"github.com/stretchr/testify/assert"
)

func TestDockerConfig_Build(t *testing.T) {
	testSuite := []struct {
		name         string
		cfg          DockerConfig
		expectedFile string
	}{
		{
			name: "single image, basic config",
			cfg: DockerConfig{
				ImageName:  "perses",
				BinaryIDs:  []string{"perses", "percli"},
				ExtraFiles: []string{"LICENSE", "docs/examples/config.docker.yaml", "plugins-archive"},
				Branch:     "foo",
			},
			expectedFile: "perses.goreleaser.yaml",
		},
		{
			name: "debug image enabled",
			cfg: DockerConfig{
				ImageName:  "perses",
				DebugImage: true,
				BinaryIDs:  []string{"perses", "percli"},
				ExtraFiles: []string{"LICENSE", "docs/examples/config.docker.yaml", "plugins-archive"},
				Branch:     "foo",
			},
			expectedFile: "debug-perses.goreleaser.yaml",
		},
		{
			name: "multiple registry",
			cfg: DockerConfig{
				ImageName: "perses",
				Registry:  []string{DefaultDockerRegistry, "ghcr.io/perses", "quay.io/perses"},
				Branch:    "foo",
			},
			expectedFile: "perses-multiple-registry.goreleaser.yaml",
		},
		{
			name: "config for main branch",
			cfg: DockerConfig{
				ImageName: "perses",
				Branch:    "main",
				Commit:    "abc1234",
				Date:      "2006-01-02",
			},
			expectedFile: "perses-main-branch.goreleaser.yaml",
		},
	}
	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			generated := test.cfg.Build()
			var expectedCFG config.Project
			if err := file.Unmarshal(filepath.Join("testdata", test.expectedFile), &expectedCFG); err != nil {
				t.Fatalf("unable to read expected file %s: %v", test.expectedFile, err)
			}
			assert.Equal(t, expectedCFG.DockersV2, generated)
		})
	}
}

func TestDockerConfig_BuildDockerImagesAndManifests(t *testing.T) {
	testSuite := []struct {
		name                 string
		cfg                  DockerConfig
		expectedManifests    []DockerManifest
		expectedDockerImages []string
	}{
		{
			name: "single image, basic config",
			cfg: DockerConfig{
				ImageName: "bar",
				Branch:    DefaultMainBranch,
				Date:      "2006-01-02",
				Commit:    "abc1234",
			},
			expectedManifests: []DockerManifest{
				{
					Name: "docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless",
					Images: []string{
						"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-amd64",
						"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-arm64",
					},
				},
			},
			expectedDockerImages: []string{
				"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-amd64",
				"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-arm64",
			},
		},
		{
			name: "multiple registries",
			cfg: DockerConfig{
				ImageName: "bar",
				Registry:  []string{"docker.io/persesdev", "ghcr.io/perses", "quay.io/perses"},
				Branch:    "main",
				Date:      "2006-01-02",
				Commit:    "abc1234",
			},
			expectedManifests: []DockerManifest{
				{
					Name: "docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless",
					Images: []string{
						"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-amd64",
						"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-arm64",
					},
				},
				{
					Name: "ghcr.io/perses/bar:main-2006-01-02-abc1234-distroless",
					Images: []string{
						"ghcr.io/perses/bar:main-2006-01-02-abc1234-distroless-amd64",
						"ghcr.io/perses/bar:main-2006-01-02-abc1234-distroless-arm64",
					},
				},
				{
					Name: "quay.io/perses/bar:main-2006-01-02-abc1234-distroless",
					Images: []string{
						"quay.io/perses/bar:main-2006-01-02-abc1234-distroless-amd64",
						"quay.io/perses/bar:main-2006-01-02-abc1234-distroless-arm64",
					},
				},
			},
			expectedDockerImages: []string{
				"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-amd64",
				"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-arm64",
				"ghcr.io/perses/bar:main-2006-01-02-abc1234-distroless-amd64",
				"ghcr.io/perses/bar:main-2006-01-02-abc1234-distroless-arm64",
				"quay.io/perses/bar:main-2006-01-02-abc1234-distroless-amd64",
				"quay.io/perses/bar:main-2006-01-02-abc1234-distroless-arm64",
			},
		},
		{
			name: "debug image enabled",
			cfg: DockerConfig{
				ImageName:  "bar",
				DebugImage: true,
				Branch:     "main",
				Date:       "2006-01-02",
				Commit:     "abc1234",
			},
			expectedManifests: []DockerManifest{
				{
					Name: "docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless",
					Images: []string{
						"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-amd64",
						"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-arm64",
					},
				},
				{
					Name: "docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-debug",
					Images: []string{
						"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-debug-amd64",
						"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-debug-arm64",
					},
				},
			},
			expectedDockerImages: []string{
				"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-amd64",
				"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-arm64",
				"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-debug-amd64",
				"docker.io/persesdev/bar:main-2006-01-02-abc1234-distroless-debug-arm64",
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			manifests, images := test.cfg.BuildDockerImagesAndManifests()
			assert.Equal(t, test.expectedDockerImages, images)
			assert.Equal(t, test.expectedManifests, manifests)
		})
	}
}
