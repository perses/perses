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
	"net/http/httptest"
	"testing"
	"time"

	projectInterface "github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/pkg/client/perseshttp"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/utils"
	"github.com/stretchr/testify/assert"
)

const retry = 25

func waitUntilNoProjectExists(t *testing.T, dao projectInterface.DAO) {
	etcdNotEmpty := true
	for i := 0; i < retry && etcdNotEmpty; i++ {
		list, err := dao.List(&projectInterface.Query{})
		assert.NoError(t, err)
		etcdNotEmpty = len(list) > 0
		time.Sleep(1 * time.Second)
	}
}

func createClient(t *testing.T, server *httptest.Server) ClientInterface {
	restClient, err := perseshttp.NewFromConfig(&perseshttp.RestConfigClient{
		URL: server.URL,
	})
	if err != nil {
		t.Fatal(err)
	}
	return NewWithClient(restClient)
}

func TestCreateProject(t *testing.T) {
	entity := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	object, err := client.Project().Create(entity)
	assert.NoError(t, err)
	assert.Equal(t, object.Metadata.Name, entity.Metadata.Name)
	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
	waitUntilNoProjectExists(t, persistenceManager.GetProject())
}

func TestCreateProjectConflict(t *testing.T) {
	entity := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	object, err := client.Project().Create(entity)
	assert.NoError(t, err)
	assert.Equal(t, object.Metadata.Name, entity.Metadata.Name)

	_, err = client.Project().Create(entity)
	assert.Error(t, err)

	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
	waitUntilNoProjectExists(t, persistenceManager.GetProject())
}

func TestUpdateProject(t *testing.T) {
	entity := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	_, err := client.Project().Create(entity)
	assert.NoError(t, err)

	object, err := client.Project().Update(entity)
	assert.NoError(t, err)

	// for the moment the only thing to test is that the dates are correctly updated
	assert.True(t, object.Metadata.CreatedAt.UnixNano() < object.Metadata.UpdatedAt.UnixNano())

	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
	waitUntilNoProjectExists(t, persistenceManager.GetProject())
}

func TestGetProject(t *testing.T) {
	entity := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}
	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	_, err := client.Project().Create(entity)
	assert.NoError(t, err)
	object, err := client.Project().Get(entity.Metadata.Name)
	assert.NoError(t, err)
	assert.Equal(t, object.Metadata.Name, entity.Metadata.Name)

	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
	waitUntilNoProjectExists(t, persistenceManager.GetProject())
}

func TestDeleteProject(t *testing.T) {
	entity := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}
	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	_, err := client.Project().Create(entity)
	assert.NoError(t, err)

	err = client.Project().Delete(entity.Metadata.Name)
	assert.NoError(t, err)
	waitUntilNoProjectExists(t, persistenceManager.GetProject())
}

func TestListProject(t *testing.T) {
	entity := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}
	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	_, err := client.Project().Create(entity)
	assert.NoError(t, err)

	result, err := client.Project().List("")
	assert.NoError(t, err)
	assert.True(t, len(result) == 1)
	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
	waitUntilNoProjectExists(t, persistenceManager.GetProject())
}
