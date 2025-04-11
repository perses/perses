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

package databasesql

import (
	"context"
	"database/sql"
	"log"
	"os"
	"testing"

	_ "github.com/go-sql-driver/mysql"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/interface/v1/project"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/testcontainers/testcontainers-go"
	testMysql "github.com/testcontainers/testcontainers-go/modules/mysql"
)

var dao *DAO

func TestMain(m *testing.M) {
	const (
		dbName     = "perses"
		dbUser     = "perses"
		dbPassword = "password"
	)
	ctx := context.Background()
	container, err := testMysql.Run(
		ctx,
		"mysql:8.0.40",
		testMysql.WithDatabase(dbName),
		testMysql.WithUsername(dbUser),
		testMysql.WithPassword(dbPassword),
	)
	if err != nil {
		log.Fatal(err.Error())
	}
	defer func() {
		if err := testcontainers.TerminateContainer(container); err != nil {
			log.Printf("failed to terminate container: %s", err)
		}
	}()
	connStr, err := container.ConnectionString(ctx)
	if err != nil {
		log.Fatal(err.Error())
	}
	db, err := sql.Open("mysql", connStr)
	if err != nil {
		log.Fatal(err.Error())
	}
	dao = &DAO{
		DB:            db,
		SchemaName:    dbName,
		CaseSensitive: true,
	}
	if err = dao.Init(); err != nil {
		log.Fatal(err.Error())
	}
	exitCode := m.Run()
	os.Exit(exitCode)
}

func removeAllResources(t *testing.T) {
	if err := dao.DeleteByQuery(&project.Query{}); err != nil {
		t.Fatal(err)
	}
}

func TestDAO_Create(t *testing.T) {
	defer removeAllResources(t)
	projectEntity := &modelV1.Project{
		Kind: modelV1.KindProject,
		Metadata: modelV1.Metadata{
			Name: "perses",
		},
	}
	assert.NoError(t, dao.Create(projectEntity))
	assert.True(t, databaseModel.IsKeyConflict(dao.Create(projectEntity)))
}

func TestDAO_Upsert(t *testing.T) {
	defer removeAllResources(t)
	projectEntity := &modelV1.Project{
		Kind: modelV1.KindProject,
		Metadata: modelV1.Metadata{
			Name: "perses",
		},
	}
	assert.NoError(t, dao.Upsert(projectEntity))
	assert.NoError(t, dao.Upsert(projectEntity))
}

func TestDAO_Get(t *testing.T) {
	defer removeAllResources(t)
	projectEntity := &modelV1.Project{
		Kind: modelV1.KindProject,
		Metadata: modelV1.Metadata{
			Name: "perses",
		},
	}
	assert.NoError(t, dao.Create(projectEntity))
	result := &modelV1.Project{}
	assert.NoError(t, dao.Get(modelV1.KindProject, projectEntity.GetMetadata(), result))
	assert.Equal(t, projectEntity.Metadata.Name, result.Metadata.Name)
}

func TestDAO_Query(t *testing.T) {
	defer removeAllResources(t)
	projectEntity := &modelV1.Project{
		Kind: modelV1.KindProject,
		Metadata: modelV1.Metadata{
			Name: "perses",
		},
	}
	assert.NoError(t, dao.Create(projectEntity))
	var result []modelV1.Project
	var result2 []*modelV1.Project
	assert.NoError(t, dao.Query(&project.Query{}, &result))
	assert.NoError(t, dao.Query(&project.Query{}, &result2))
	assert.Equal(t, projectEntity.Metadata.Name, result[0].Metadata.Name)
	assert.Equal(t, projectEntity.Metadata.Name, result2[0].Metadata.Name)
}

func TestDAO_Delete(t *testing.T) {
	defer removeAllResources(t)
	projectEntity := &modelV1.Project{
		Kind: modelV1.KindProject,
		Metadata: modelV1.Metadata{
			Name: "perses",
		},
	}
	assert.NoError(t, dao.Create(projectEntity))
	assert.NoError(t, dao.Delete(modelV1.KindProject, projectEntity.GetMetadata()))
	result := &modelV1.Project{}
	assert.True(t, databaseModel.IsKeyNotFound(dao.Get(modelV1.KindProject, projectEntity.GetMetadata(), result)))
}
