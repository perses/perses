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

// TestDAO_GetPathTraversal ensures a resource name containing ".." segments
// cannot be used to read a file located outside the configured data folder.
func TestDAO_GetPathTraversal(t *testing.T) {
	root := t.TempDir()
	folder := filepath.Join(root, "data")
	if err := os.MkdirAll(folder, 0750); err != nil {
		t.Fatal(err)
	}
	// A sensitive file sitting outside the data folder. Its name matches the
	// traversal payload so that the case-sensitivity check in Get cannot mask a
	// successful read.
	outsideFile := filepath.Join(root, "secret.json")
	if err := os.WriteFile(outsideFile, []byte(`{"kind":"GlobalDatasource","metadata":{"name":"../../secret"}}`), 0600); err != nil {
		t.Fatal(err)
	}

	d := &DAO{Folder: folder, Extension: config.JSONExtension}
	result := &modelV1.GlobalDatasource{}
	err := d.Get(modelV1.KindGlobalDatasource, modelV1.NewMetadata("../../secret"), result)
	assert.True(t, databaseModel.IsKeyNotFound(err))
	assert.Empty(t, result.Metadata.Name)
}

// TestDAO_DeletePathTraversal ensures a resource name containing ".." segments
// cannot be used to delete a file located outside the configured data folder.
func TestDAO_DeletePathTraversal(t *testing.T) {
	root := t.TempDir()
	folder := filepath.Join(root, "data")
	if err := os.MkdirAll(folder, 0750); err != nil {
		t.Fatal(err)
	}
	outsideFile := filepath.Join(root, "secret.json")
	if err := os.WriteFile(outsideFile, []byte(`{}`), 0600); err != nil {
		t.Fatal(err)
	}

	d := &DAO{Folder: folder, Extension: config.JSONExtension}
	err := d.Delete(modelV1.KindGlobalDatasource, modelV1.NewMetadata("../../secret"))
	assert.True(t, databaseModel.IsKeyNotFound(err))
	_, statErr := os.Stat(outsideFile)
	assert.NoError(t, statErr, "the file outside the data folder must not be deleted")
}
