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

package watch

import (
	"bytes"
	"path/filepath"
	"sort"
	"testing"
	"time"
)

func TestParseGoImports(t *testing.T) {
	tests := []struct {
		name     string
		file     string
		expected []string
	}{
		{
			name: "dashboard with single import",
			file: filepath.Join("testdata", "go-simple", "dashboards", "dash1", "main.go"),
			expected: []string{
				"test-dac.com/m/mylibrary",
			},
		},
		{
			name: "library with nested import",
			file: filepath.Join("testdata", "go-simple", "mylibrary", "lib.go"),
			expected: []string{
				"test-dac.com/m/mylibrary/nested",
			},
		},
		{
			name:     "nested library with no imports",
			file:     filepath.Join("testdata", "go-simple", "mylibrary", "nested", "deep.go"),
			expected: nil,
		},
	}

	w := &watcher{
		sourceDir: filepath.Join("testdata", "go-simple"),
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := w.parseGoImports(tt.file)
			if !equalStringSlices(result, tt.expected) {
				t.Errorf("parseGoImports(%s) = %v, expected %v", tt.file, result, tt.expected)
			}
		})
	}
}

func TestParseCueImports(t *testing.T) {
	tests := []struct {
		name     string
		file     string
		expected []string
	}{
		{
			name: "dashboard with multiple imports",
			file: filepath.Join("testdata", "cue-simple", "dashboards", "dash1.cue"),
			expected: []string{
				"github.com/perses/perses/cue/dac-utils/dashboard",
				"test-dac-cue.com/m/panels",
			},
		},
		{
			name: "dashboard with single import",
			file: filepath.Join("testdata", "cue-simple", "dashboards", "my-dashboard.cue"),
			expected: []string{
				"test-dac-cue.com/m/panels",
			},
		},
		{
			name:     "library with no imports",
			file:     filepath.Join("testdata", "cue-simple", "panels", "panel.cue"),
			expected: nil,
		},
	}

	w := &watcher{
		sourceDir: filepath.Join("testdata", "cue-simple"),
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := w.parseCueImports(tt.file)
			if !equalStringSlices(result, tt.expected) {
				t.Errorf("parseCueImports(%s) = %v, expected %v", tt.file, result, tt.expected)
			}
		})
	}
}

func TestFindDashboardFiles(t *testing.T) {
	tests := []struct {
		name      string
		sourceDir string
		expected  []string
	}{
		{
			name:      "Go project with 2 dashboards",
			sourceDir: filepath.Join("testdata", "go-simple"),
			expected: []string{
				filepath.Join("testdata", "go-simple", "dashboards", "dash1", "main.go"),
				filepath.Join("testdata", "go-simple", "dashboards", "dash2", "main.go"),
			},
		},
		{
			name:      "CUE project with 2 dashboards",
			sourceDir: filepath.Join("testdata", "cue-simple"),
			expected: []string{
				filepath.Join("testdata", "cue-simple", "dashboards", "dash1.cue"),
				filepath.Join("testdata", "cue-simple", "dashboards", "my-dashboard.cue"),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var buf bytes.Buffer
			w := &watcher{
				sourceDir: tt.sourceDir,
				buildDir:  "built",
				writer:    &buf,
			}
			result := w.findDashboardFiles()

			// Sort both slices for comparison
			sort.Strings(result)
			sort.Strings(tt.expected)

			if !equalStringSlices(result, tt.expected) {
				t.Errorf("findDashboardFiles() found %d files, expected %d", len(result), len(tt.expected))
				t.Errorf("  Got: %v", result)
				t.Errorf("  Expected: %v", tt.expected)
			}
		})
	}
}

func TestBuildDependencyMap(t *testing.T) {
	tests := []struct {
		name             string
		sourceDir        string
		expectedLibCount int
		libraryChecks    map[string][]string // library file -> expected dashboards
	}{
		{
			name:             "Go project dependencies",
			sourceDir:        filepath.Join("testdata", "go-simple"),
			expectedLibCount: 2, // mylibrary/lib.go and mylibrary/nested/deep.go
			libraryChecks: map[string][]string{
				filepath.Join("testdata", "go-simple", "mylibrary", "lib.go"): {
					filepath.Join("testdata", "go-simple", "dashboards", "dash1", "main.go"),
					filepath.Join("testdata", "go-simple", "dashboards", "dash2", "main.go"),
				},
				filepath.Join("testdata", "go-simple", "mylibrary", "nested", "deep.go"): {
					filepath.Join("testdata", "go-simple", "dashboards", "dash1", "main.go"),
					filepath.Join("testdata", "go-simple", "dashboards", "dash2", "main.go"),
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var buf bytes.Buffer
			w := &watcher{
				sourceDir:     tt.sourceDir,
				buildDir:      "built",
				writer:        &buf,
				dependencyMap: make(map[string][]string),
				allDashboards: make(map[string]bool),
			}

			w.buildDependencyMap()

			if len(w.dependencyMap) != tt.expectedLibCount {
				t.Errorf("buildDependencyMap() found %d libraries, expected %d", len(w.dependencyMap), tt.expectedLibCount)
			}

			for libFile, expectedDashboards := range tt.libraryChecks {
				dashboards, exists := w.dependencyMap[libFile]
				if !exists {
					t.Errorf("Expected dependency map to contain %s", libFile)
					continue
				}

				sort.Strings(dashboards)
				sort.Strings(expectedDashboards)

				if !equalStringSlices(dashboards, expectedDashboards) {
					t.Errorf("Library %s has wrong dashboards", libFile)
					t.Errorf("  Got: %v", dashboards)
					t.Errorf("  Expected: %v", expectedDashboards)
				}
			}
		})
	}
}

func TestFindAffectedDashboards(t *testing.T) {
	var buf bytes.Buffer
	w := &watcher{
		sourceDir:     filepath.Join("testdata", "go-simple"),
		buildDir:      "built",
		writer:        &buf,
		dependencyMap: make(map[string][]string),
		allDashboards: make(map[string]bool),
	}

	// Build dependency map first
	w.buildDependencyMap()

	tests := []struct {
		name               string
		changedFiles       []string
		expectedDashboards []string
	}{
		{
			name: "changing library affects both dashboards",
			changedFiles: []string{
				filepath.Join("testdata", "go-simple", "mylibrary", "lib.go"),
			},
			expectedDashboards: []string{
				filepath.Join("testdata", "go-simple", "dashboards", "dash1", "main.go"),
				filepath.Join("testdata", "go-simple", "dashboards", "dash2", "main.go"),
			},
		},
		{
			name: "changing nested library affects both dashboards (transitive)",
			changedFiles: []string{
				filepath.Join("testdata", "go-simple", "mylibrary", "nested", "deep.go"),
			},
			expectedDashboards: []string{
				filepath.Join("testdata", "go-simple", "dashboards", "dash1", "main.go"),
				filepath.Join("testdata", "go-simple", "dashboards", "dash2", "main.go"),
			},
		},
		{
			name: "changing dashboard file returns no dashboards",
			changedFiles: []string{
				filepath.Join("testdata", "go-simple", "dashboards", "dash1", "main.go"),
			},
			expectedDashboards: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := w.findAffectedDashboards(tt.changedFiles)

			sort.Strings(result)
			sort.Strings(tt.expectedDashboards)

			if !equalStringSlices(result, tt.expectedDashboards) {
				t.Errorf("findAffectedDashboards() returned wrong dashboards")
				t.Errorf("  Got: %v", result)
				t.Errorf("  Expected: %v", tt.expectedDashboards)
			}
		})
	}
}

func TestNewWatcher(t *testing.T) {
	var buf bytes.Buffer
	w := newWatcher(
		filepath.Join("testdata", "go-simple"),
		"built",
		"yaml",
		500*time.Millisecond,
		&buf,
		&buf,
	)

	if w == nil {
		t.Fatal("newWatcher() returned nil")
	}

	if w.sourceDir != filepath.Join("testdata", "go-simple") {
		t.Errorf("sourceDir = %v, expected %v", w.sourceDir, filepath.Join("testdata", "go-simple"))
	}

	if w.debounceDelay != 500*time.Millisecond {
		t.Errorf("debounceDelay = %v, expected %v", w.debounceDelay, 500*time.Millisecond)
	}

	// Check that dependency map was built
	if len(w.dependencyMap) == 0 {
		t.Error("Expected dependency map to be built on initialization")
	}

	// Check that dashboards were found
	if len(w.allDashboards) == 0 {
		t.Error("Expected dashboards to be found on initialization")
	}
}

// Helper function to compare string slices
func equalStringSlices(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
