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
	"testing"

	"github.com/goreleaser/goreleaser/v2/pkg/config"
	"github.com/perses/perses/internal/cli/file"
	"github.com/stretchr/testify/assert"
)

func TestGenerate(t *testing.T) {
	generate()
	assert.FileExists(t, ".goreleaser.yaml")
	var cfg config.Project
	var expectedCfg config.Project
	assert.NoError(t, file.Unmarshal(".goreleaser.yaml", &cfg))
	assert.NoError(t, file.Unmarshal("testdata/expected-config.goreleaser.yaml", &expectedCfg))
	assert.Equal(t, expectedCfg, cfg)
}
