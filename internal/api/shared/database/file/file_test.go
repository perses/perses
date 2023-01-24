// Copyright 2023 The Perses Authors
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

package databaseFile

import (
	"os"
	"testing"

	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/interface/v1/project"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

func clear(t *testing.T) {
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
	clear(t)
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
	clear(t)
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
	clear(t)
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
	assert.NoError(t, d.Query(&project.Query{}, &result))
	assert.Equal(t, projectEntity.Metadata.Name, result[0].Metadata.Name)
	clear(t)
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
	clear(t)
}
