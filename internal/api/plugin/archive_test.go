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

package plugin

import (
	"archive/tar"
	"compress/gzip"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	testArchiveFileName = "MyPlugin-1.0.0.tar.gz"
	testPluginFolder    = "MyPlugin-1.0.0"
	testManifestFile    = "mf-manifest.json"
)

// writeTarGz creates a tar.gz archive containing the given files and sets the modification time of the archive.
func writeTarGz(t *testing.T, archivePath string, files map[string]string, modTime time.Time) {
	t.Helper()
	out, err := os.Create(archivePath) //nolint: gosec
	require.NoError(t, err)
	gz := gzip.NewWriter(out)
	tw := tar.NewWriter(gz)
	for name, content := range files {
		require.NoError(t, tw.WriteHeader(&tar.Header{
			Name:     name,
			Mode:     0o644,
			Size:     int64(len(content)),
			ModTime:  modTime,
			Typeflag: tar.TypeReg,
		}))
		_, err = tw.Write([]byte(content))
		require.NoError(t, err)
	}
	require.NoError(t, tw.Close())
	require.NoError(t, gz.Close())
	require.NoError(t, out.Close())
	require.NoError(t, os.Chtimes(archivePath, modTime, modTime))
}

func readTestFile(t *testing.T, path string) string {
	t.Helper()
	data, err := os.ReadFile(path) //nolint: gosec
	require.NoError(t, err)
	return string(data)
}

// setupExtractedArchive creates an archive, extracts it, and returns the archive service, the archive path and the manifest path.
func setupExtractedArchive(t *testing.T) (*arch, string, string) {
	t.Helper()
	archiveFolder := t.TempDir()
	targetFolder := t.TempDir()
	archivePath := filepath.Join(archiveFolder, testArchiveFileName)
	writeTarGz(t, archivePath, map[string]string{
		testManifestFile:           `{"name":"v1"}`,
		"__mf/js/main.f55169be.js": "console.log('v1')",
	}, time.Date(2024, time.March, 12, 10, 30, 0, 0, time.UTC))

	a := &arch{folders: []string{archiveFolder}, targetFolder: targetFolder}
	require.NoError(t, a.unzipAll())
	return a, archivePath, filepath.Join(targetFolder, testPluginFolder, testManifestFile)
}

func TestUnzipAllExtractsArchiveAndWritesMarker(t *testing.T) {
	a, archivePath, manifestPath := setupExtractedArchive(t)
	pluginFolder := filepath.Join(a.targetFolder, testPluginFolder)

	assert.Equal(t, `{"name":"v1"}`, readTestFile(t, manifestPath))
	assert.Equal(t, "console.log('v1')", readTestFile(t, filepath.Join(pluginFolder, "__mf", "js", "main.f55169be.js")))
	assert.FileExists(t, filepath.Join(pluginFolder, extractionMarkerFileName))

	archiveInfo, err := os.Stat(archivePath)
	require.NoError(t, err)
	assert.True(t, isAlreadyExtracted(pluginFolder, newArchiveFingerprint(archiveInfo)))
}

func TestUnzipAllSkipsAlreadyExtractedArchive(t *testing.T) {
	a, _, manifestPath := setupExtractedArchive(t)
	// Modify an extracted file: if the archive is extracted again, the modification is lost.
	require.NoError(t, os.WriteFile(manifestPath, []byte("modified"), 0o600))

	require.NoError(t, a.unzipAll())
	assert.Equal(t, "modified", readTestFile(t, manifestPath))
}

func TestUnzipAllExtractsAgainWhenArchiveChanges(t *testing.T) {
	a, archivePath, manifestPath := setupExtractedArchive(t)
	// Replace the archive with a new one having the same name (e.g. a plugin rebuilt without changing its version).
	writeTarGz(t, archivePath, map[string]string{
		testManifestFile: `{"name":"v2"}`,
	}, time.Date(2024, time.April, 1, 8, 0, 0, 0, time.UTC))

	require.NoError(t, a.unzipAll())
	assert.Equal(t, `{"name":"v2"}`, readTestFile(t, manifestPath))

	// The marker has been updated, so the next extraction is skipped again.
	require.NoError(t, os.WriteFile(manifestPath, []byte("modified"), 0o600))
	require.NoError(t, a.unzipAll())
	assert.Equal(t, "modified", readTestFile(t, manifestPath))
}

func TestUnzipAllExtractsAgainWhenMarkerIsNotValid(t *testing.T) {
	tests := []struct {
		name         string
		updateMarker func(t *testing.T, markerPath string)
	}{
		{
			// For example, when the plugin folder has been extracted by a previous version of Perses,
			// or when the extraction has been interrupted.
			name: "missing marker",
			updateMarker: func(t *testing.T, markerPath string) {
				require.NoError(t, os.Remove(markerPath))
			},
		},
		{
			name: "corrupted marker",
			updateMarker: func(t *testing.T, markerPath string) {
				require.NoError(t, os.WriteFile(markerPath, []byte("{not a json"), 0o600))
			},
		},
		{
			name: "marker of another archive",
			updateMarker: func(t *testing.T, markerPath string) {
				require.NoError(t, os.WriteFile(markerPath, []byte(`{"name":"MyPlugin-0.9.0.tar.gz","size":42,"modTime":"2024-03-12T10:30:00Z"}`), 0o600))
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			a, _, manifestPath := setupExtractedArchive(t)
			require.NoError(t, os.WriteFile(manifestPath, []byte("modified"), 0o600))
			tt.updateMarker(t, filepath.Join(a.targetFolder, testPluginFolder, extractionMarkerFileName))

			require.NoError(t, a.unzipAll())
			assert.Equal(t, `{"name":"v1"}`, readTestFile(t, manifestPath))
		})
	}
}
