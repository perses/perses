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

func TestCreateUser(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewUser()

	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	object, err := persesClient.User().Create(entity)
	assert.NoError(t, err)
	utils.WaitUntilEntityIsCreate(t, persistenceManager, entity)

	assert.Equal(t, object.Metadata.Name, entity.Metadata.Name)
	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestUpdateUser(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewUser()

	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	_, err := persesClient.User().Create(entity)
	assert.NoError(t, err)
	utils.WaitUntilEntityIsCreate(t, persistenceManager, entity)

	object, err := persesClient.User().Update(entity)
	assert.NoError(t, err)

	// for the moment the only thing to test is that the dates are correctly updated
	assert.True(t, object.Metadata.CreatedAt.UnixNano() < object.Metadata.UpdatedAt.UnixNano())

	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestGetUser(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewUser()
	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	_, err := persesClient.User().Create(entity)
	assert.NoError(t, err)
	utils.WaitUntilEntityIsCreate(t, persistenceManager, entity)

	object, err := persesClient.User().Get(entity.Metadata.Name)
	assert.NoError(t, err)
	assert.Equal(t, object.Metadata.Name, entity.Metadata.Name)

	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestDeleteUser(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewUser()
	server, persistenceManager, _ := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	_, err := persesClient.User().Create(entity)
	assert.NoError(t, err)
	utils.WaitUntilEntityIsCreate(t, persistenceManager, entity)

	err = persesClient.User().Delete(entity.Metadata.Name)
	assert.NoError(t, err)
}

func TestListUser(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewUser()
	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	persesClient := createClient(t, server)

	_, err := persesClient.User().Create(entity)
	assert.NoError(t, err)
	utils.WaitUntilEntityIsCreate(t, persistenceManager, entity)

	objects, err := persesClient.User().List("")
	assert.NoError(t, err)
	assert.Equal(t, 1, len(objects))
	assert.Equal(t, entity.Metadata.Name, objects[0].Metadata.Name)

	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}
