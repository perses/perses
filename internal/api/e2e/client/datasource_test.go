// Copyright 2021 The Perses Authors
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

//go:build integration

package client

import (
	"testing"

	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/pkg/client/api/v1"
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/stretchr/testify/assert"
)

func TestCreateDatasource(t *testing.T) {
	withClient(t, func(clientInterface v1.ClientInterface, manager dependency.PersistenceManager) []modelAPI.Entity {
		projectEntity := e2eframework.NewProject("perses")
		entity := e2eframework.NewDatasource(t, "perses", "myDTS")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, projectEntity)

		object, err := clientInterface.Datasource(entity.Metadata.Project).Create(entity)
		assert.NoError(t, err)
		assert.Equal(t, object.Metadata.Name, entity.Metadata.Name)
		assert.Equal(t, entity.Spec, object.Spec)
		return []modelAPI.Entity{projectEntity, entity}
	})
}

func TestUpdateDatasource(t *testing.T) {
	withClient(t, func(clientInterface v1.ClientInterface, manager dependency.PersistenceManager) []modelAPI.Entity {
		projectEntity := e2eframework.NewProject("perses")
		entity := e2eframework.NewDatasource(t, "perses", "myDTS")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, projectEntity)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, entity)

		object, err := clientInterface.Datasource(entity.Metadata.Project).Update(entity)
		assert.NoError(t, err)

		// for the moment the only thing to test is that the dates are correctly updated
		assert.True(t, object.Metadata.CreatedAt.UnixNano() < object.Metadata.UpdatedAt.UnixNano())
		assert.Equal(t, entity.Spec, object.Spec)
		return []modelAPI.Entity{projectEntity, entity}
	})
}

func TestGetDatasource(t *testing.T) {
	withClient(t, func(clientInterface v1.ClientInterface, manager dependency.PersistenceManager) []modelAPI.Entity {
		projectEntity := e2eframework.NewProject("perses")
		entity := e2eframework.NewDatasource(t, "perses", "myDTS")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, projectEntity)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, entity)

		object, err := clientInterface.Datasource(entity.Metadata.Project).Get(entity.Metadata.Name)
		assert.NoError(t, err)
		assert.Equal(t, entity.Metadata.Name, object.Metadata.Name)
		assert.Equal(t, entity.Spec, object.Spec)
		return []modelAPI.Entity{projectEntity, entity}
	})
}

func TestDeleteDatasource(t *testing.T) {
	withClient(t, func(clientInterface v1.ClientInterface, manager dependency.PersistenceManager) []modelAPI.Entity {
		projectEntity := e2eframework.NewProject("perses")
		entity := e2eframework.NewDatasource(t, "perses", "myDTS")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, projectEntity)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, entity)

		err := clientInterface.Datasource(entity.Metadata.Project).Delete(entity.Metadata.Name)
		assert.NoError(t, err)
		return []modelAPI.Entity{projectEntity}
	})
}

func TestListDatasource(t *testing.T) {
	withClient(t, func(clientInterface v1.ClientInterface, manager dependency.PersistenceManager) []modelAPI.Entity {
		projectEntity := e2eframework.NewProject("perses")
		entity := e2eframework.NewDatasource(t, "perses", "myDTS")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, projectEntity)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, entity)

		objects, err := clientInterface.Datasource(entity.Metadata.Project).List("")
		assert.NoError(t, err)
		assert.Equal(t, 1, len(objects))
		assert.Equal(t, entity.Metadata.Name, objects[0].Metadata.Name)

		return []modelAPI.Entity{projectEntity, entity}
	})
}
