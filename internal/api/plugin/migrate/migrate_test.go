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

package migrate

import (
	"os"
	"path/filepath"
	"testing"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

// TestLoadSkipsMigrateFolderWithWrongPackage ensures that a "migrate" folder whose
// migrate.cue does not belong to the "migrate" package is skipped instead of being
// loaded. The package check is meant to ignore such folders, but a bug used to make
// the skip unreachable, so the file was passed to LoadMigrateSchema and produced a
// build error instead of being silently ignored.
func TestLoadSkipsMigrateFolderWithWrongPackage(t *testing.T) {
	pluginPath := t.TempDir()
	migrateDir := filepath.Join(pluginPath, "schemas", "migrate")
	if err := os.MkdirAll(migrateDir, 0o750); err != nil {
		t.Fatal(err)
	}
	// migrate.cue that belongs to another package than "migrate".
	migrateContent := []byte("package notmigrate\n\nkind: \"FooChart\"\nspec: {}\n")
	if err := os.WriteFile(filepath.Join(migrateDir, "migrate.cue"), migrateContent, 0o600); err != nil {
		t.Fatal(err)
	}

	schemas, err := Load(pluginPath, v1.ModuleSpec{SchemasPath: "schemas"})
	assert.NoError(t, err)
	assert.Empty(t, schemas)
}
