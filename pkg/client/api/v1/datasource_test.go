// Copyright 2021 Amadeus s.a.s
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

func TestCreateDatasource(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewDatasource(t)

	server, _, etcdClient := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	object, err := persesClient.Datasource().Create(entity)
	assert.NoError(t, err)

	assert.Equal(t, object.Metadata.Name, entity.Metadata.Name)
	assert.Equal(t, entity.Spec, object.Spec)
	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestUpdateDatasource(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewDatasource(t)

	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	object, err := persesClient.Datasource().Update(entity)
	assert.NoError(t, err)

	// for the moment the only thing to test is that the dates are correctly updated
	assert.True(t, object.Metadata.CreatedAt.UnixNano() < object.Metadata.UpdatedAt.UnixNano())
	assert.Equal(t, entity.Spec, object.Spec)

	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestGetDatasource(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewDatasource(t)
	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	object, err := persesClient.Datasource().Get(entity.Metadata.Name)
	assert.NoError(t, err)
	assert.Equal(t, entity.Metadata.Name, object.Metadata.Name)
	assert.Equal(t, entity.Spec, object.Spec)

	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestDeleteDatasource(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewDatasource(t)
	server, persistenceManager, _ := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	err := persesClient.Datasource().Delete(entity.Metadata.Name)
	assert.NoError(t, err)
}

func TestListDatasource(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewDatasource(t)
	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	objects, err := persesClient.Datasource().List("")
	assert.NoError(t, err)
	assert.Equal(t, 1, len(objects))
	assert.Equal(t, entity.Metadata.Name, objects[0].Metadata.Name)

	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}
