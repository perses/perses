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

// +build integration

package v1

import (
	"testing"

	"github.com/perses/perses/utils"
	"github.com/stretchr/testify/assert"
)

func TestCreateProject(t *testing.T) {
	entity := utils.NewProject()

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	object, err := persesClient.Project().Create(entity)
	assert.NoError(t, err)

	assert.Equal(t, object.Metadata.Name, entity.Metadata.Name)
	utils.ClearAllKeys(t, persistenceManager.GetPersesDAO(), entity.GenerateID())
}

func TestUpdateProject(t *testing.T) {
	entity := utils.NewProject()

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	object, err := persesClient.Project().Update(entity)
	assert.NoError(t, err)

	// for the moment the only thing to test is that the dates are correctly updated
	assert.True(t, object.Metadata.CreatedAt.UnixNano() < object.Metadata.UpdatedAt.UnixNano())

	utils.ClearAllKeys(t, persistenceManager.GetPersesDAO(), entity.GenerateID())
}

func TestGetProject(t *testing.T) {
	entity := utils.NewProject()

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	object, err := persesClient.Project().Get(entity.Metadata.Name)
	assert.NoError(t, err)
	assert.Equal(t, object.Metadata.Name, entity.Metadata.Name)

	utils.ClearAllKeys(t, persistenceManager.GetPersesDAO(), entity.GenerateID())
}

func TestDeleteProject(t *testing.T) {
	entity := utils.NewProject()

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	err := persesClient.Project().Delete(entity.Metadata.Name)
	assert.NoError(t, err)
}

func TestListProject(t *testing.T) {
	entity := utils.NewProject()

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	objects, err := persesClient.Project().List("")
	assert.NoError(t, err)
	assert.Equal(t, 1, len(objects))
	assert.Equal(t, entity.Metadata.Name, objects[0].Metadata.Name)

	utils.ClearAllKeys(t, persistenceManager.GetPersesDAO(), entity.GenerateID())
}
