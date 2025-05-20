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

package build

import (
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetDependency(t *testing.T) {
	testSuite := []struct {
		name       string
		modulePath string
		expected   []cueDep
	}{
		{
			name:       "no dependency",
			modulePath: filepath.Join("testdata", "emptydeps", "cue.mod", "module.cue"),
		},
		{
			name:       "single dependency",
			modulePath: filepath.Join("testdata", "barchart", "cue.mod", "module.cue"),
			expected: []cueDep{
				{
					moduleName:               "github.com/perses/perses/cue@v0",
					modulePathInCueCaching:   filepath.Join("github.com", "perses", "perses", "cue@v0.51.0-preview"),
					modulePathWithoutVersion: filepath.Join("github.com", "perses", "perses", "cue"),
					version:                  "v0.51.0-preview",
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			c := &cueVendor{
				moduleFilePath: test.modulePath,
			}
			deps, _ := c.getDependency()
			assert.Equal(t, test.expected, deps)
		})
	}
}
