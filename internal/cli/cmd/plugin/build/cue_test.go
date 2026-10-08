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

package build

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const testModuleFile = `module: "github.com/perses/test@v0"
language: {
	version: "v0.17.1"
}
deps: {
	"github.com/perses/shared/cue@v0": {
		v: "v0.1.0"
	}
	"github.com/perses/spec/cue@v0": {
		v: "v0.2.0"
	}
}
`

// fakeCacheDep creates a fake extracted CUE module in the given CUE cache dir.
func fakeCacheDep(t *testing.T, cueCacheDir string, modulePathInCueCaching string) {
	t.Helper()
	dir := filepath.Join(cueCacheDir, "mod", "extract", modulePathInCueCaching, "common")
	require.NoError(t, os.MkdirAll(dir, 0750))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "common.cue"), []byte("package common\n"), 0600))
}

// setupPlugin creates a fake plugin with a module file declaring two dependencies, and returns the associated cueVendor.
func setupPlugin(t *testing.T) *cueVendor {
	t.Helper()
	pluginPath := t.TempDir()
	require.NoError(t, os.MkdirAll(filepath.Join(pluginPath, "cue.mod"), 0750))
	moduleFilePath := filepath.Join(pluginPath, "cue.mod", moduleFile)
	require.NoError(t, os.WriteFile(moduleFilePath, []byte(testModuleFile), 0600))
	return &cueVendor{
		pluginPath:           pluginPath,
		moduleFilePath:       moduleFilePath,
		moduleFileBackupPath: filepath.Join(pluginPath, moduleFileBackup),
		vendorDirPath:        filepath.Join(pluginPath, "cue.mod", vendorDir),
	}
}

func assertVendored(t *testing.T, c *cueVendor) {
	t.Helper()
	for _, dep := range []string{"shared", "spec"} {
		assert.FileExists(t, filepath.Join(c.vendorDirPath, "github.com", "perses", dep, "cue", "common", "common.cue"))
	}
	data, err := os.ReadFile(c.moduleFilePath)
	require.NoError(t, err)
	assert.NotContains(t, string(data), "deps")
}

func assertRestored(t *testing.T, c *cueVendor) {
	t.Helper()
	assert.NoDirExists(t, c.vendorDirPath)
	data, err := os.ReadFile(c.moduleFilePath)
	require.NoError(t, err)
	assert.Equal(t, testModuleFile, string(data))
}

func TestMissingDependencies(t *testing.T) {
	cueCacheDir := t.TempDir()
	present := cueDep{moduleName: "github.com/perses/shared/cue@v0", modulePathInCueCaching: filepath.Join("github.com", "perses", "shared", "cue@v0.1.0")}
	absent := cueDep{moduleName: "github.com/perses/spec/cue@v0", modulePathInCueCaching: filepath.Join("github.com", "perses", "spec", "cue@v0.2.0")}
	require.NoError(t, os.MkdirAll(filepath.Join(cueCacheDir, present.modulePathInCueCaching), 0750))

	missing, err := missingDependencies(cueCacheDir, []cueDep{present, absent})
	require.NoError(t, err)
	assert.Equal(t, []cueDep{absent}, missing)
}

func TestVendorCueDependenciesFromCache(t *testing.T) {
	cueCacheDir := t.TempDir()
	t.Setenv("CUE_CACHE_DIR", cueCacheDir)
	fakeCacheDep(t, cueCacheDir, filepath.Join("github.com", "perses", "shared", "cue@v0.1.0"))
	fakeCacheDep(t, cueCacheDir, filepath.Join("github.com", "perses", "spec", "cue@v0.2.0"))
	c := setupPlugin(t)

	restore, err := c.vendorCueDependencies()
	require.NoError(t, err)
	require.NotNil(t, restore)
	assertVendored(t, c)

	restore()
	assertRestored(t, c)
}

// TestVendorCueDependenciesPartialCache is a regression test: when only some dependencies are in the CUE cache,
// the missing ones must be downloaded BEFORE anything is written in the vendor directory. Otherwise `cue mod tidy`
// finds the packages both in cue.mod/pkg and in the registry and fails with an "ambiguous import" error.
func TestVendorCueDependenciesPartialCache(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("the fake cue binary is a shell script")
	}
	cueCacheDir := t.TempDir()
	t.Setenv("CUE_CACHE_DIR", cueCacheDir)
	// Only the first dependency is in the cache.
	fakeCacheDep(t, cueCacheDir, filepath.Join("github.com", "perses", "shared", "cue@v0.1.0"))

	// Fake `cue` binary: fails like the real one if the vendor dir already exists, otherwise "downloads" the missing dep.
	binDir := t.TempDir()
	missingDepDir := filepath.Join(cueCacheDir, "mod", "extract", "github.com", "perses", "spec", "cue@v0.2.0", "common")
	script := strings.Join([]string{
		"#!/bin/sh",
		`if [ -d cue.mod/pkg ]; then echo "ambiguous import" >&2; exit 1; fi`,
		`mkdir -p "` + missingDepDir + `"`,
		`echo "package common" > "` + filepath.Join(missingDepDir, "common.cue") + `"`,
	}, "\n") + "\n"
	require.NoError(t, os.WriteFile(filepath.Join(binDir, "cue"), []byte(script), 0700)) // nolint: gosec
	t.Setenv("PATH", binDir+string(os.PathListSeparator)+os.Getenv("PATH"))

	c := setupPlugin(t)
	restore, err := c.vendorCueDependencies()
	require.NoError(t, err)
	require.NotNil(t, restore)
	assertVendored(t, c)

	restore()
	assertRestored(t, c)
}

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
					moduleName:               "github.com/perses/shared/cue@v0",
					modulePathInCueCaching:   filepath.Join("github.com", "perses", "shared", "cue@v0.53.1"),
					modulePathWithoutVersion: filepath.Join("github.com", "perses", "shared", "cue"),
					version:                  "v0.53.1",
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
