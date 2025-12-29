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
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/goreleaser/goreleaser/v2/pkg/config"
	"github.com/perses/perses/scripts/pkg/git"
	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
)

const (
	DefaultDockerRegistry  = "docker.io/persesdev"
	DefaultDebugDockerfile = "distroless-debug.Dockerfile"
	DefaultDebugSuffix     = "-debug"
	DefaultMainBranch      = "main"
)

var (
	DefaultPlatform = []string{"linux/amd64", "linux/arm64"}
	DefaultTags     = []string{
		"latest",
		"{{ .Tag }}",
		"v{{ .Major }}.{{ .Minor }}",
		"{{ .Tag }}-distroless",
		"v{{ .Major }}.{{ .Minor }}-distroless",
	}
)

type DockerManifest struct {
	// The name of the manifest associated to the docker images. For example: "docker.io/persesdev/perses:latest"
	Name string
	// The list of images associated to the manifest. Each image corresponds to a platform.
	// For example: "docker.io/persesdev/perses:latest-amd64"
	Images []string
}

// DockerConfig represents the configuration needed to generate the Goreleaser docker config.
type DockerConfig struct {
	// The name of the docker image to generate. For example: "perses".
	// This is a required field.
	ImageName string
	// The list of binaries to include in the docker image.
	// The binary must be built by Goreleaser and the IDs must match the ones defined in the build section of the Goreleaser config.
	BinaryIDs []string
	// If true, we add a debug image with "debug-" prefix containing additional debugging tools (curl, bash, etc)
	DebugImage bool
	// The path to the Dockerfile to use for the debug image.
	// If empty, a default Dockerfile is used: "distroless-debug.Dockerfile"
	DebugDockerfile string
	// By default, we push to Docker Hub, so if empty the registry is docker.io/persesdev
	Registry []string
	// The list of platforms to build the docker image for.
	// If empty, the default platforms targeted are "linux/amd64" and "linux/arm64".
	Platform []string
	// List of extra files to include in the docker image.
	// Leave it empty if no extra files are needed.
	ExtraFiles []string

	// Internal fields

	// The current git branch
	// This is an internal field populated automatically, but can be overridden for testing.
	Branch string
	// The current git commit
	// This is an internal field populated automatically, but can be overridden for testing.
	Commit string
	// The current date string
	// This is an internal field populated automatically, but can be overridden for testing.
	Date string
}

// validate validates the DockerConfig.
// It returns an error if the configuration is invalid.
// Be aware that some fields are populated during the completeDefaults step.
// As such, this function should not check for those fields.
// Be aware also, this function is called before completeDefaults.
func (c *DockerConfig) validate() error {
	if len(c.ImageName) == 0 {
		return fmt.Errorf("ImageName must be provided")
	}
	return nil
}

func (c *DockerConfig) completeDefaults() {
	if len(c.Registry) == 0 {
		c.Registry = []string{DefaultDockerRegistry}
	}
	if len(c.Platform) == 0 {
		c.Platform = DefaultPlatform
	}
	if len(c.DebugDockerfile) == 0 {
		c.DebugDockerfile = DefaultDebugDockerfile
	}

	// We are populating internal fields if not already set to allow test to override them.
	if len(c.Commit) == 0 {
		c.Commit = git.CurrentCommit()
	}
	if len(c.Branch) == 0 {
		c.Branch = git.CurrentBranch()
	}
	if len(c.Date) == 0 {
		c.Date = time.Now().Format("2006-01-02")
	}
}

func (c *DockerConfig) generateImageNames() []string {
	var imageNames []string
	for _, registry := range c.Registry {
		imageNames = append(imageNames, fmt.Sprintf("%s/%s", registry, c.ImageName))
	}
	return imageNames
}

func (c *DockerConfig) generateTags(debug bool) []string {
	var suffix string
	if debug {
		suffix = DefaultDebugSuffix
	}
	if c.Branch == DefaultMainBranch {
		return []string{fmt.Sprintf("%s-%s-%s-distroless%s", DefaultMainBranch, c.Date, c.Commit, suffix)}
	}
	var tags []string
	for _, tag := range DefaultTags {
		tags = append(tags, fmt.Sprintf("%s%s", tag, suffix))
	}
	return tags
}

func (c *DockerConfig) Build() []config.DockerV2 {
	c.completeDefaults()
	labels := map[string]string{
		"org.opencontainers.image.authors":     "The Perses Authors <perses-team@googlegroups.com>",
		"org.opencontainers.image.title":       "{{ .ProjectName }}",
		"org.opencontainers.image.description": "{{ .ProjectName }}",
		"org.opencontainers.image.url":         "https://perses.dev",
		"org.opencontainers.image.source":      "https://github.com/perses/{{ .ProjectName }}",
		"org.opencontainers.image.version":     "{{ .Version }}",
		"org.opencontainers.image.created":     "{{ .Date }}",
		"org.opencontainers.image.revision":    "{{ .FullCommit }}",
		"org.opencontainers.image.licenses":    "Apache-2.0",
	}
	flags := []string{"--pull"}
	images := c.generateImageNames()
	cfg := []config.DockerV2{
		{
			ID:         c.ImageName,
			IDs:        c.BinaryIDs,
			Dockerfile: "Dockerfile",
			Images:     images,
			Tags:       c.generateTags(false),
			Labels:     labels,
			ExtraFiles: c.ExtraFiles,
			Platforms:  c.Platform,
			Flags:      flags,
		},
	}
	if c.DebugImage {
		cfg = append(cfg, config.DockerV2{
			ID:         c.ImageName + DefaultDebugSuffix,
			IDs:        c.BinaryIDs,
			Dockerfile: c.DebugDockerfile,
			Images:     images,
			Tags:       c.generateTags(true),
			Labels:     labels,
			ExtraFiles: c.ExtraFiles,
			Platforms:  c.Platform,
			Flags:      flags,
		})
	}
	return cfg
}

// BuildDockerImagesAndManifests builds the list of docker images and Manifests to be pushed for the main branch.
// This function should not be used for other branches as we are not pushing images for other branches.
// The exceptiong is during the release process where goreleaser will handle everything automatically (tags, manifests, etc).
func (c *DockerConfig) BuildDockerImagesAndManifests() ([]DockerManifest, []string) {
	configs := c.Build()
	var images []string
	var manifests []DockerManifest
	if c.Branch != DefaultMainBranch {
		logrus.Fatal("BuildDockerImages only works with main branch")
	}
	for _, cfg := range configs {
		for _, image := range cfg.Images {
			for _, tag := range cfg.Tags {
				manifest := DockerManifest{Name: fmt.Sprintf("%s:%s", image, tag)}
				for _, platform := range c.Platform {
					// What we are doing here is totally based on how goreleaser is generating the images names for each platform and tag when it is building multi-arch images during a non release build.
					// Unfortunately, goreleaser is not exposing a way to get the list of images generated for each platform and tag.
					// So we have to reproduce the logic here.
					// It also means, that if goreleaser changes the way it generates the image names, this code will break.
					// For example, goreleaser does not include the platform name in the image name while it includes the architecture.
					// This might change in the future.
					//
					// the format is platform/arch (e.g., linux/amd64)
					plt := strings.Split(platform, "/")
					if len(plt) != 2 {
						logrus.Warnf("Invalid platform: %s", platform)
						continue
					}
					manifest.Images = append(manifest.Images, fmt.Sprintf("%s-%s", manifest.Name, plt[1]))
				}
				manifests = append(manifests, manifest)
				images = append(images, manifest.Images...)
			}
		}
	}
	return manifests, images
}

func readGoreleaserBaseFile(baseConfig []byte) *config.Project {
	c := &config.Project{}
	if err := yaml.Unmarshal(baseConfig, c); err != nil {
		logrus.Fatal(err)
	}
	return c
}

func Generate(baseConfig []byte, dockerConfig *DockerConfig) {
	if err := dockerConfig.validate(); err != nil {
		logrus.Fatal(err)
	}
	c := readGoreleaserBaseFile(baseConfig)
	c.DockersV2 = dockerConfig.Build()
	data, err := yaml.Marshal(c)
	if err != nil {
		logrus.Fatal(err)
	}
	if writeErr := os.WriteFile(".goreleaser.yaml", data, 0600); writeErr != nil {
		logrus.Fatal(writeErr)
	}
}

// BuildManifestsAndPushIt is going to build the manifests and push them to the docker registry.
// It will also push the images for each platform assuming they are already built and tagged locally.
func BuildManifestsAndPushIt(dockerConfig *DockerConfig) {
	if dockerConfig == nil {
		logrus.Fatal("dockerConfig cannot be nil")
	}
	if err := dockerConfig.validate(); err != nil {
		logrus.Fatal(err)
	}
	manifests, images := dockerConfig.BuildDockerImagesAndManifests()
	for _, image := range images {
		if output, err := exec.Command("docker", "push", image).Output(); err != nil { //nolint: gosec
			logrus.WithError(err).Fatalf("unable to push the docker image %q. Output: %q", image, output)
		}
	}
	for _, manifest := range manifests {
		args := []string{"manifest", "create", manifest.Name}
		args = append(args, manifest.Images...)
		if output, err := exec.Command("docker", args...).Output(); err != nil { //nolint: gosec
			logrus.WithError(err).Fatalf("unable to create the docker manifest %q. Output: %q", manifest.Name, output)
		}
		if output, err := exec.Command("docker", "manifest", "push", manifest.Name).Output(); err != nil { //nolint:gosec
			logrus.WithError(err).Fatalf("unable to push the docker manifest %q. Output: %q", manifest.Name, output)
		}
	}
}
