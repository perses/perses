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

package main

import (
	"context"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	formulaVersion  = "0.54.0"
	releaseVersion  = "0.55.1"
	notStableErrMsg = "is not a stable semver version"
)

var (
	checksumA = strings.Repeat("a", 64)
	checksumB = strings.Repeat("b", 64)
)

func readTestData(t *testing.T, name string) string {
	t.Helper()
	data, err := fs.ReadFile(os.DirFS("testdata"), name)
	require.NoError(t, err)
	return string(data)
}

func readChecksums(t *testing.T) map[string]string {
	t.Helper()
	checksums, err := parseChecksums(strings.NewReader(readTestData(t, "checksums.txt")))
	require.NoError(t, err)
	return checksums
}

// newTap creates a tap where every formula is the given content.
func newTap(t *testing.T, formula string) *os.Root {
	t.Helper()
	root, err := os.OpenRoot(t.TempDir())
	require.NoError(t, err)
	t.Cleanup(func() { assert.NoError(t, root.Close()) })
	for _, name := range formulae {
		require.NoError(t, root.WriteFile(name, []byte(formula), 0600))
	}
	return root
}

func TestStableVersion(t *testing.T) {
	testSuite := []struct {
		name        string
		version     string
		expected    string
		expectedErr string
	}{
		{name: "with leading v", version: "v0.55.1", expected: "0.55.1"},
		{name: "without leading v", version: "0.55.1", expected: "0.55.1"},
		{name: "beta", version: "v0.56.0-beta.0", expectedErr: notStableErrMsg},
		{name: "release candidate", version: "v0.56.0-rc.1", expectedErr: notStableErrMsg},
		{name: "build metadata", version: "v0.56.0+build", expectedErr: notStableErrMsg},
		{name: "missing patch", version: "v0.56", expectedErr: notStableErrMsg},
		{name: "not a version", version: "foo", expectedErr: notStableErrMsg},
		{name: "empty", version: "", expectedErr: notStableErrMsg},
	}
	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			version, err := stableVersion(test.version)
			if test.expectedErr != "" {
				assert.ErrorContains(t, err, test.expectedErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.expected, version)
		})
	}
}

func TestCurrentVersion(t *testing.T) {
	testSuite := []struct {
		name        string
		formula     string
		expected    string
		expectedErr string
	}{
		{name: "formula of the tap", formula: readTestData(t, "perses.rb"), expected: formulaVersion},
		{name: "double quotes", formula: "  version \"0.54.0\"\n", expected: formulaVersion},
		{name: "pre-release version", formula: "  version '0.56.0-beta.0'\n", expectedErr: notStableErrMsg},
		{name: "missing version", formula: "class Perses < Formula\nend\n", expectedErr: "no version found"},
	}
	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			version, err := currentVersion(test.formula)
			if test.expectedErr != "" {
				assert.ErrorContains(t, err, test.expectedErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.expected, version)
		})
	}
}

func TestParseChecksums(t *testing.T) {
	testSuite := []struct {
		name        string
		input       string
		expected    map[string]string
		expectedErr string
	}{
		{
			name:     "valid checksums",
			input:    checksumA + "  a.tar.gz\n" + checksumB + "  b.tar.gz\n",
			expected: map[string]string{"a.tar.gz": checksumA, "b.tar.gz": checksumB},
		},
		{
			name:     "blank lines are ignored",
			input:    "\n" + checksumA + "  a.tar.gz\n\n",
			expected: map[string]string{"a.tar.gz": checksumA},
		},
		{
			name:     "empty file",
			input:    "",
			expected: map[string]string{},
		},
		{
			name:        "invalid checksum",
			input:       "not-a-checksum  a.tar.gz\n",
			expectedErr: "invalid checksum line",
		},
		{
			name:        "missing archive name",
			input:       checksumA + "\n",
			expectedErr: "invalid checksum line",
		},
		{
			name:        "extra field",
			input:       checksumA + "  a.tar.gz  extra\n",
			expectedErr: "invalid checksum line",
		},
	}
	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			checksums, err := parseChecksums(strings.NewReader(test.input))
			if test.expectedErr != "" {
				assert.ErrorContains(t, err, test.expectedErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.expected, checksums)
		})
	}
}

func TestDownloadChecksums(t *testing.T) {
	bodies := map[string]string{
		"/checksums.txt": readTestData(t, "checksums.txt"),
		"/invalid.txt":   "not-a-checksum  a.tar.gz\n",
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, ok := bodies[r.URL.Path]
		if !ok {
			http.NotFound(w, r)
			return
		}
		_, err := io.WriteString(w, body)
		assert.NoError(t, err)
	}))
	t.Cleanup(server.Close)

	testSuite := []struct {
		name        string
		path        string
		expectedErr string
	}{
		{name: "checksums found", path: "/checksums.txt"},
		{name: "checksums not found", path: "/missing.txt", expectedErr: "unexpected status 404 Not Found"},
		{name: "invalid checksums", path: "/invalid.txt", expectedErr: "invalid checksum line"},
	}
	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			checksums, err := downloadChecksums(t.Context(), server.URL+test.path)
			if test.expectedErr != "" {
				assert.ErrorContains(t, err, test.expectedErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, readChecksums(t), checksums)
		})
	}
}

func TestUpdateFormula(t *testing.T) {
	formula := readTestData(t, "perses.rb")
	testSuite := []struct {
		name        string
		formula     string
		expected    string
		expectedErr string
	}{
		{
			name:     "update version and checksums",
			formula:  formula,
			expected: readTestData(t, "perses.expected.rb"),
		},
		{
			name:        "missing checksum",
			formula:     strings.ReplaceAll(formula, "_linux_arm64.tar.gz", "_linux_riscv64.tar.gz"),
			expectedErr: `no checksum found for the archive "perses_0.55.1_linux_riscv64.tar.gz"`,
		},
		{
			name:        "url without sha256",
			formula:     strings.Replace(formula, "sha256", "# sha256", 1),
			expectedErr: `no sha256 found for the archive "perses_0.55.1_linux_arm64.tar.gz"`,
		},
		{
			name:        "sha256 without url",
			formula:     strings.Replace(formula, "url", "# url", 1),
			expectedErr: "is not preceded by a url",
		},
		{
			name:        "missing version",
			formula:     strings.Replace(formula, "version '"+formulaVersion+"'", "", 1),
			expectedErr: "expected exactly one version, found 0",
		},
		{
			name:        "no url and sha256",
			formula:     "class Perses < Formula\n  version '" + formulaVersion + "'\nend\n",
			expectedErr: "no url and sha256 found",
		},
	}
	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			updated, err := updateFormula(test.formula, releaseVersion, readChecksums(t))
			if test.expectedErr != "" {
				assert.ErrorContains(t, err, test.expectedErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.expected, updated)
		})
	}
}

func TestUpdateTap(t *testing.T) {
	formula := readTestData(t, "perses.rb")
	// Only the checksums of releaseVersion are available, so the cases that must not download anything fail if they do.
	fetchChecksums := func(_ context.Context, version string) (map[string]string, error) {
		if version != releaseVersion {
			return nil, fmt.Errorf("no checksums for the version %q", version)
		}
		return readChecksums(t), nil
	}

	testSuite := []struct {
		name            string
		version         string
		expectedFormula string
		expectedErr     string
	}{
		{
			name:            "newer version",
			version:         releaseVersion,
			expectedFormula: readTestData(t, "perses.expected.rb"),
		},
		{
			name:            "same version",
			version:         formulaVersion,
			expectedFormula: formula,
		},
		{
			name:            "older version",
			version:         "0.53.1",
			expectedFormula: formula,
		},
		{
			name:            "checksums unavailable",
			version:         "0.56.0",
			expectedFormula: formula,
			expectedErr:     `no checksums for the version "0.56.0"`,
		},
	}
	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			root := newTap(t, formula)
			err := updateTap(t.Context(), root, test.version, fetchChecksums)
			if test.expectedErr != "" {
				assert.ErrorContains(t, err, test.expectedErr)
			} else {
				require.NoError(t, err)
			}
			for _, name := range formulae {
				data, readErr := root.ReadFile(name)
				require.NoError(t, readErr)
				assert.Equal(t, test.expectedFormula, string(data))
			}
		})
	}
}

func TestRun(t *testing.T) {
	// The tap already provides the release, so nothing is downloaded.
	tapDir := newTap(t, readTestData(t, "perses.expected.rb")).Name()
	testSuite := []struct {
		name        string
		version     string
		tapDir      string
		expectedErr string
	}{
		{name: "tap up to date", version: "v" + releaseVersion, tapDir: tapDir},
		{name: "missing version", tapDir: tapDir, expectedErr: "the flag --version is required"},
		{name: "missing tap directory", version: "v" + releaseVersion, expectedErr: "the flag --tap-dir is required"},
		{name: "pre-release", version: "v0.56.0-beta.0", tapDir: tapDir, expectedErr: notStableErrMsg},
		{
			name:        "tap directory not found",
			version:     "v" + releaseVersion,
			tapDir:      filepath.Join(tapDir, "missing"),
			expectedErr: "unable to open the Homebrew tap directory",
		},
	}
	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			err := run(test.version, test.tapDir)
			if test.expectedErr != "" {
				assert.ErrorContains(t, err, test.expectedErr)
				return
			}
			assert.NoError(t, err)
		})
	}
}
