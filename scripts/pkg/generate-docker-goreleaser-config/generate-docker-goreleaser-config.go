package goreleasergenerate

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/goreleaser/goreleaser/v2/pkg/config"
	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
)

const dockerOrg = "docker.io/persesdev"

var date = time.Now().Format("2006-01-02")

func getCurrentBranch() string {
	branch, err := exec.Command("git", "branch", "--show-current").Output()
	if err != nil {
		logrus.WithError(err).Fatal("unable to get the current branch")
	}
	return strings.TrimSpace(string(branch))
}

func getCurrentCommit() string {
	commit, err := exec.Command("git", "log", "-n1", "--format=\"%h\"").Output()
	if err != nil {
		logrus.WithError(err).Fatal("unable to get the current commit")
	}
	return strings.TrimSuffix(strings.TrimPrefix(strings.TrimSpace(string(commit)), "\""), "\"")
}

func join(elems []string, sep string) string {
	var sb strings.Builder
	for i := range elems {
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

func readGoreleaserBaseFile(baseConfig []byte) *config.Project {
	c := &config.Project{}
	if err := yaml.Unmarshal(baseConfig, c); err != nil {
		logrus.Fatal(err)
	}
	return c
}

type dockerTemplateName struct {
	shortName string
	longName  string
}

type goreleaserGenerator struct {
	goreleaserConfig                 *config.Project
	dockerSupportedArches            []string
	mapDockerfileNameAndTemplateName map[string]dockerTemplateName
	currentBranch                    string
	currentCommit                    string
	dockerBaseImageName              string
	repo                             string
	extraFiles                       []string
}

func (g *goreleaserGenerator) generateDockerImageName(arch string, templateLongName string) string {
	if g.currentBranch == "main" {
		return fmt.Sprintf("%s:main-%s-%s-%s-%s", g.dockerBaseImageName, date, g.currentCommit, templateLongName, arch)
	}
	return fmt.Sprintf("%s:{{ .Tag }}-%s-%s", g.dockerBaseImageName, templateLongName, arch)
}

func (g *goreleaserGenerator) generateDockerConfig() {
	var binaryIDs []string
	for _, build := range g.goreleaserConfig.Builds {
		binaryIDs = append(binaryIDs, build.ID)
	}
	for dockerfileName, templateNames := range g.mapDockerfileNameAndTemplateName {
		for _, arch := range g.dockerSupportedArches {
			g.goreleaserConfig.Dockers = append(g.goreleaserConfig.Dockers, config.Docker{
				Goos:       "linux",
				Goarch:     arch,
				IDs:        binaryIDs,
				Dockerfile: dockerfileName,
				Use:        "buildx",
				ImageTemplates: []string{
					g.generateDockerImageName(arch, templateNames.longName),
				},
				BuildFlagTemplates: []string{
					"--pull",
					"--label=org.opencontainers.image.authors=The Perses Authors <perses-team@googlegroups.com>",
					"--label=org.opencontainers.image.title={{ .ProjectName }}",
					"--label=org.opencontainers.image.description={{ .ProjectName }}",
					fmt.Sprintf("--label=org.opencontainers.image.url=https://github.com/perses/%s", g.repo),
					fmt.Sprintf("--label=org.opencontainers.image.source=https://github.com/perses/%s", g.repo),
					"--label=org.opencontainers.image.version={{ .Version }}",
					"--label=org.opencontainers.image.created={{ .Date }}",
					"--label=org.opencontainers.image.revision={{ .FullCommit }}",
					"--label=org.opencontainers.image.licenses=Apache-2.0",
					fmt.Sprintf("--platform=linux/%s", arch),
				},
				Files: g.extraFiles,
			})
		}
	}
}

func (g *goreleaserGenerator) generateDockerManifest() {
	if g.currentBranch == "main" {
		g.generateDockerManifestForMainBranch()
	} else {
		g.generateDockerManifestForReleaseOrSnapshot()
	}
}

func (g *goreleaserGenerator) generateDockerManifestForMainBranch() {
	for _, templateNames := range g.mapDockerfileNameAndTemplateName {
		var imageTemplate []string
		for _, arch := range g.dockerSupportedArches {
			imageTemplate = append(imageTemplate, g.generateDockerImageName(arch, templateNames.longName))
		}
		g.goreleaserConfig.DockerManifests = append(g.goreleaserConfig.DockerManifests,
			config.DockerManifest{
				NameTemplate:   fmt.Sprintf("%s:main-%s-%s-%s", g.dockerBaseImageName, date, g.currentCommit, templateNames.longName),
				ImageTemplates: imageTemplate,
			})
	}
}

func (g *goreleaserGenerator) generateDockerManifestForReleaseOrSnapshot() {
	for _, templateNames := range g.mapDockerfileNameAndTemplateName {
		var imageTemplate []string
		for _, arch := range g.dockerSupportedArches {
			imageTemplate = append(imageTemplate, g.generateDockerImageName(arch, templateNames.longName))
		}
		g.goreleaserConfig.DockerManifests = append(g.goreleaserConfig.DockerManifests,
			config.DockerManifest{
				NameTemplate:   fmt.Sprintf("%s:%s", g.dockerBaseImageName, join([]string{"latest", templateNames.shortName}, "-")),
				ImageTemplates: imageTemplate,
			})
		templateNameList := []string{templateNames.shortName, templateNames.longName}
		for _, templateName := range templateNameList {
			g.goreleaserConfig.DockerManifests = append(g.goreleaserConfig.DockerManifests,
				config.DockerManifest{
					NameTemplate:   fmt.Sprintf("%s:%s", g.dockerBaseImageName, join([]string{"{{ .Tag }}", templateName}, "-")),
					ImageTemplates: imageTemplate,
				},
				config.DockerManifest{
					NameTemplate:   fmt.Sprintf("%s:%s", g.dockerBaseImageName, join([]string{"v{{ .Major }}.{{ .Minor }}", templateName}, "-")),
					ImageTemplates: imageTemplate,
				})
		}
	}
}

func GenerateGoreleaserConfig(baseGoreleaserConfig []byte, repo string, extraFiles []string) {
	c := readGoreleaserBaseFile(baseGoreleaserConfig)
	generator := &goreleaserGenerator{
		goreleaserConfig:      c,
		repo:                  repo,
		dockerBaseImageName:   fmt.Sprintf("%s/%s", dockerOrg, repo),
		extraFiles:            extraFiles,
		dockerSupportedArches: []string{"amd64", "arm64"},
		mapDockerfileNameAndTemplateName: map[string]dockerTemplateName{
			"Dockerfile":                  {shortName: "", longName: "distroless"},
			"distroless-debug.Dockerfile": {shortName: "debug", longName: "distroless-debug"},
		},
		currentBranch: getCurrentBranch(),
		currentCommit: getCurrentCommit(),
	}
	generator.generateDockerConfig()
	generator.generateDockerManifest()
	data, err := yaml.Marshal(c)
	if err != nil {
		logrus.Fatal(err)
	}
	if writeErr := os.WriteFile(".goreleaser.yaml", data, 0600); writeErr != nil {
		logrus.Fatal(writeErr)
	}
}
