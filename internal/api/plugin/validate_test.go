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
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestIsRequiredFileExists(t *testing.T) {
	testSuites := []struct {
		title       string
		packageJSON *string
		expectError bool
	}{
		{
			title:       "package.json is missing",
			packageJSON: nil,
			expectError: true,
		},
		{
			title:       "package.json is not valid JSON",
			packageJSON: strPtr("{"),
			expectError: true,
		},
		{
			title:       "package.json is present and valid",
			packageJSON: strPtr(`{"version": "0.1.0"}`),
			expectError: false,
		},
	}
	for _, test := range testSuites {
		t.Run(test.title, func(t *testing.T) {
			folder := t.TempDir()
			// the manifest file must exist so that the first check passes and the
			// package.json reading is actually reached.
			require.NoError(t, os.WriteFile(filepath.Join(folder, ManifestFileName), []byte("{}"), 0600))
			if test.packageJSON != nil {
				require.NoError(t, os.WriteFile(filepath.Join(folder, PackageJSONFile), []byte(*test.packageJSON), 0600))
			}
			err := IsRequiredFileExists(folder, folder, folder)
			if test.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func strPtr(s string) *string {
	return &s
}
