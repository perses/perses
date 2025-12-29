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

package dockerconfig

import "github.com/perses/perses/scripts/pkg/goreleaser"

type TestConfig struct {
	Branch string
	Commit string
	Date   string
}

// PersesDockerConfig represents the configuration needed to generate the docker section of a goreleaser config.
// It is written in a dedicated package to be reused by different scripts.
func PersesDockerConfig(cfg TestConfig) *goreleaser.DockerConfig {
	return &goreleaser.DockerConfig{
		ImageName:  "perses",
		DebugImage: true,
		BinaryIDs:  []string{"perses", "percli"},
		ExtraFiles: []string{"LICENSE", "docs/examples/config.docker.yaml", "plugins-archive"},
		Branch:     cfg.Branch,
		Commit:     cfg.Commit,
		Date:       cfg.Date,
	}
}
