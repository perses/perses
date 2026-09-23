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

package databasefile

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

func removeAllFiles(t *testing.T) {
	if err := os.RemoveAll("./test"); err != nil {
		t.Fatal(err)
	}
}

func newDAO() *DAO {
	return &DAO{
		Folder:    "./test",
		Extension: config.JSONExtension,
	}
}

func TestDAO_Create(t *testing.T) {
	d := newDAO()
	projectEntity := &modelV1.Project{
		Kind: modelV1.KindProject,
		Metadata: modelV1.Metadata{
			Name: "perses",
		},
	}
	assert.NoError(t, d.Create(projectEntity))
	assert.True(t, databaseModel.IsKeyConflict(d.Create(projectEntity)))
	removeAllFiles(t)
}

func TestDAO_Upsert(t *testing.T) {
	d := newDAO()
	projectEntity := &modelV1.Project{
		Kind: modelV1.KindProject,
		Metadata: modelV1.Metadata{
			Name: "perses",
		},
	}
	assert.NoError(t, d.Upsert(projectEntity))
	assert.NoError(t, d.Upsert(projectEntity))
	removeAllFiles(t)
}

func TestDAO_Get(t *testing.T) {
	d := newDAO()
	projectEntity := &modelV1.Project{
		Kind: modelV1.KindProject,
		Metadata: modelV1.Metadata{
			Name: "perses",
		},
	}
	assert.NoError(t, d.Create(projectEntity))
	result := &modelV1.Project{}
	assert.NoError(t, d.Get(modelV1.KindProject, projectEntity.GetMetadata(), result))
	assert.Equal(t, projectEntity.Metadata.Name, result.Metadata.Name)
	removeAllFiles(t)
}

func TestDAO_Query(t *testing.T) {
	d := newDAO()
	projectEntity := &modelV1.Project{
		Kind: modelV1.KindProject,
		Metadata: modelV1.Metadata{
			Name: "perses",
		},
	}
	assert.NoError(t, d.Create(projectEntity))
	var result []modelV1.Project
	var result2 []*modelV1.Project
	assert.NoError(t, d.Query(&project.Query{}, &result))
	assert.NoError(t, d.Query(&project.Query{}, &result2))
	assert.Equal(t, projectEntity.Metadata.Name, result[0].Metadata.Name)
	assert.Equal(t, projectEntity.Metadata.Name, result2[0].Metadata.Name)
	removeAllFiles(t)
}

func TestDAO_Delete(t *testing.T) {
	d := newDAO()
	projectEntity := &modelV1.Project{
		Kind: modelV1.KindProject,
		Metadata: modelV1.Metadata{
			Name: "perses",
		},
	}
	assert.NoError(t, d.Create(projectEntity))
	assert.NoError(t, d.Delete(modelV1.KindProject, projectEntity.GetMetadata()))
	result := &modelV1.Project{}
	assert.True(t, databaseModel.IsKeyNotFound(d.Get(modelV1.KindProject, projectEntity.GetMetadata(), result)))
	removeAllFiles(t)
}

// maliciousIDs is a list of names that attempt to escape the DAO folder or to
// otherwise manipulate the resulting file path.
var maliciousIDs = []string{
	"..",
	".",
	"../secret",
	"../../etc/passwd",
	"..%2F..%2Fetc%2Fpasswd",
	"foo/../../secret",
	"foo/bar",
	"/etc/passwd",
	"..\\..\\windows\\system32",
	"foo\\bar",
	"secret\x00",
}

// assertNoFileOutsideFolder walks the given folder and its parent and fails if an unexpected file was created.
// A canary file is created in the parent folder before the test to make sure we detect any overwrite as well.
func createCanary(t *testing.T, parent string) (string, []byte) {
	canaryPath := filepath.Join(parent, "secret."+string(config.JSONExtension))
	content := []byte(`{"canary": true}`)
	if err := os.WriteFile(canaryPath, content, 0600); err != nil {
		t.Fatal(err)
	}
	return canaryPath, content
}

func TestDAO_PathTraversal_Metadata(t *testing.T) {
	parent := t.TempDir()
	d := &DAO{
		Folder:    filepath.Join(parent, "db"),
		Extension: config.JSONExtension,
	}
	canaryPath, canaryContent := createCanary(t, parent)

	for _, id := range maliciousIDs {
		t.Run(id, func(t *testing.T) {
			entity := &modelV1.Project{
				Kind: modelV1.KindProject,
				Metadata: modelV1.Metadata{
					Name: id,
				},
			}
			// every write / read / delete operation must be rejected before touching the filesystem
			assert.True(t, databaseModel.IsKeyBadRequest(d.Create(entity)), "Create should reject %q", id)
			assert.True(t, databaseModel.IsKeyBadRequest(d.Upsert(entity)), "Upsert should reject %q", id)
			assert.True(t, databaseModel.IsKeyBadRequest(d.Get(modelV1.KindProject, entity.GetMetadata(), &modelV1.Project{})), "Get should reject %q", id)
			assert.True(t, databaseModel.IsKeyBadRequest(d.Delete(modelV1.KindProject, entity.GetMetadata())), "Delete should reject %q", id)

			// the DAO folder must not even have been created
			_, err := os.Stat(d.Folder)
			assert.True(t, os.IsNotExist(err), "DAO folder should not exist after rejected operations for %q", id)
			// the canary outside the DAO folder must be untouched
			content, err := os.ReadFile(canaryPath) //nolint: gosec // this is a test for path traversal, so we need to read a file outside the DAO folder
			assert.NoError(t, err, "canary file must still exist for %q", id)
			assert.Equal(t, canaryContent, content, "canary file must not be modified for %q", id)
		})
	}
}

func TestDAO_PathTraversal_ProjectMetadata(t *testing.T) {
	parent := t.TempDir()
	d := &DAO{
		Folder:    filepath.Join(parent, "db"),
		Extension: config.JSONExtension,
	}
	canaryPath, canaryContent := createCanary(t, parent)

	for _, id := range maliciousIDs {
		// the traversal can be attempted through the project field as well as the name field
		testCases := []struct {
			title    string
			metadata modelV1.ProjectMetadata
		}{
			{
				title:    "name/" + id,
				metadata: modelV1.ProjectMetadata{Metadata: modelV1.Metadata{Name: id}, ProjectMetadataWrapper: modelV1.ProjectMetadataWrapper{Project: "perses"}},
			},
			{
				title:    "project/" + id,
				metadata: modelV1.ProjectMetadata{Metadata: modelV1.Metadata{Name: "dashboard"}, ProjectMetadataWrapper: modelV1.ProjectMetadataWrapper{Project: id}},
			},
		}
		for _, tc := range testCases {
			t.Run(tc.title, func(t *testing.T) {
				entity := &modelV1.Dashboard{
					Kind:     modelV1.KindDashboard,
					Metadata: tc.metadata,
				}
				assert.True(t, databaseModel.IsKeyBadRequest(d.Create(entity)), "Create should reject %q", tc.title)
				assert.True(t, databaseModel.IsKeyBadRequest(d.Upsert(entity)), "Upsert should reject %q", tc.title)
				assert.True(t, databaseModel.IsKeyBadRequest(d.Get(modelV1.KindDashboard, entity.GetMetadata(), &modelV1.Dashboard{})), "Get should reject %q", tc.title)
				assert.True(t, databaseModel.IsKeyBadRequest(d.Delete(modelV1.KindDashboard, entity.GetMetadata())), "Delete should reject %q", tc.title)

				_, err := os.Stat(d.Folder)
				assert.True(t, os.IsNotExist(err), "DAO folder should not exist after rejected operations for %q", tc.title)
				content, err := os.ReadFile(canaryPath) //nolint: gosec // this is a test for path traversal, so we need to read a file outside the DAO folder
				assert.NoError(t, err, "canary file must still exist for %q", tc.title)
				assert.Equal(t, canaryContent, content, "canary file must not be modified for %q", tc.title)
			})
		}
	}
}

func TestDAO_PathTraversal_BuildPathStaysInFolder(t *testing.T) {
	d := newDAO()
	// A valid ID must always produce a path located inside the DAO folder.
	key, err := generateID(modelV1.KindProject, &modelV1.Metadata{Name: "perses"})
	assert.NoError(t, err)
	absFolder, err := filepath.Abs(d.Folder)
	assert.NoError(t, err)
	absPath, err := filepath.Abs(d.buildPath(key))
	assert.NoError(t, err)
	assert.True(t, strings.HasPrefix(absPath, absFolder+string(filepath.Separator)), "path %q must be inside %q", absPath, absFolder)
}
