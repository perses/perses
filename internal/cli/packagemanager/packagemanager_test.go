// Copyright The Perses Authors
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

package packagemanager

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestDetect(t *testing.T) {
	testSuite := []struct {
		title    string
		root     map[string]string
		plugin   map[string]string
		expected PackageManager
	}{
		{
			title:    "no lockfile and no declaration",
			expected: PackageManager{Name: PNPM},
		},
		{
			title:    "pnpm lockfile",
			plugin:   map[string]string{"pnpm-lock.yaml": ""},
			expected: PackageManager{Name: PNPM, HasLockFile: true},
		},
		{
			title:    "npm lockfile",
			plugin:   map[string]string{"package-lock.json": "{}"},
			expected: PackageManager{Name: NPM, HasLockFile: true},
		},
		{
			title:    "yarn lockfile",
			plugin:   map[string]string{"yarn.lock": ""},
			expected: PackageManager{Name: Yarn, HasLockFile: true},
		},
		{
			title:    "lockfile in the workspace root",
			root:     map[string]string{"package-lock.json": "{}"},
			plugin:   map[string]string{"package.json": `{"name": "plugin"}`},
			expected: PackageManager{Name: NPM, HasLockFile: true},
		},
		{
			title:    "packageManager field wins over another lockfile",
			plugin:   map[string]string{"package.json": `{"packageManager": "pnpm@12.15.0"}`, "package-lock.json": "{}"},
			expected: PackageManager{Name: PNPM},
		},
		{
			title:    "packageManager field with matching lockfile",
			plugin:   map[string]string{"package.json": `{"packageManager": "yarn@4.0.0+sha512.abc"}`, "yarn.lock": ""},
			expected: PackageManager{Name: Yarn, HasLockFile: true},
		},
		{
			title:    "devEngines.packageManager object",
			root:     map[string]string{"package.json": `{"devEngines": {"packageManager": {"name": "npm"}}}`},
			expected: PackageManager{Name: NPM},
		},
		{
			title:    "devEngines.packageManager array",
			root:     map[string]string{"package.json": `{"devEngines": {"packageManager": [{"name": "bun"}, {"name": "pnpm"}]}}`, "pnpm-lock.yaml": ""},
			expected: PackageManager{Name: PNPM, HasLockFile: true},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			root := t.TempDir()
			pluginDir := filepath.Join(root, "plugin")
			writeFiles(t, root, test.root)
			writeFiles(t, pluginDir, test.plugin)
			assert.Equal(t, test.expected, Detect(pluginDir))
		})
	}
}

func TestPackageManagerArgs(t *testing.T) {
	assert.Equal(t, []string{"install", "--frozen-lockfile"}, PackageManager{Name: PNPM, HasLockFile: true}.InstallArgs())
	assert.Equal(t, []string{"ci"}, PackageManager{Name: NPM, HasLockFile: true}.InstallArgs())
	assert.Equal(t, []string{"install", "--frozen-lockfile"}, PackageManager{Name: Yarn, HasLockFile: true}.InstallArgs())
	assert.Equal(t, []string{"install"}, PackageManager{Name: NPM}.InstallArgs())
	assert.Equal(t, []string{"run", "build"}, PackageManager{Name: PNPM}.RunArgs("build"))
}

func writeFiles(t *testing.T, dir string, files map[string]string) {
	t.Helper()
	if err := os.MkdirAll(dir, 0o750); err != nil {
		t.Fatal(err)
	}
	for name, content := range files {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o600); err != nil {
			t.Fatal(err)
		}
	}
}
