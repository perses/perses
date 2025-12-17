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
	_ "embed"

	"github.com/perses/perses/scripts/pkg/goreleaser"
)

//go:embed .goreleaser.base.yaml
var baseConfig []byte

type testConfig struct {
	branch string
	commit string
	date   string
}

func generate(cfg testConfig) {
	goreleaser.Generate(baseConfig, &goreleaser.DockerConfig{
		ImageName:  "perses",
		DebugImage: true,
		BinaryIDs:  []string{"perses", "percli"},
		ExtraFiles: []string{"LICENSE", "docs/examples/config.docker.yaml", "plugins-archive"},
		Branch:     cfg.branch,
		Commit:     cfg.commit,
		Date:       cfg.date,
	})
}

func main() {
	generate(testConfig{})
}
