// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the \"License\");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an \"AS IS\" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package license

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCollectFilesNotContainingLicense(t *testing.T) {
	// Create isolated temp workspace and switch to it since the function walks the current directory
	tmp := t.TempDir()
	cwd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chdir(cwd) }()
	if chErr := os.Chdir(tmp); chErr != nil {
		t.Fatal(chErr)
	}

	// Create a set of files covering cases: with license, without license, excluded file,
	// excluded dir, excluded pattern, and a nested file
	files := map[string]string{
		"file_with_license.go":                     "// " + licenseCopyright + "\npackage main\n",
		"file_without_license.go":                  "// no license here\npackage main\n",
		"excluded.go":                              "// no license\npackage main\n",
		filepath.Join("dir1", "nested_without.go"): "// something else\npackage main\n",
		filepath.Join("excludeDir", "skip.go"):     "// nothing\npackage main\n",
		"excluded_pattern_test.go":                 "// no license\npackage main\n",
	}

	for name, content := range files {
		if mkdirErr := os.MkdirAll(filepath.Dir(name), 0750); mkdirErr != nil {
			t.Fatal(mkdirErr)
		}
		if writeErr := os.WriteFile(name, []byte(content), 0600); writeErr != nil {
			t.Fatal(writeErr)
		}
	}

	l := &License{
		Patterns:         []string{"*.go"},
		ExcludedFiles:    []string{"excluded.go"},
		ExcludedDirs:     []string{"excludeDir"},
		ExcludedPatterns: []string{"excluded_*"},
	}

	res := l.collectFilesNotContainingLicense(".")

	// Expect these files to be reported as missing the license
	want := []string{filepath.Join("dir1", "nested_without.go"), "file_without_license.go"}
	assert.Equal(t, res, want)
}
