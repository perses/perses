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

	"github.com/perses/perses/pkg/client/perseshttp"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/utils"
	"github.com/stretchr/testify/assert"
)

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
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := &v1.Project{
		Kind: v1.KindProject,
		Metadata: v1.Metadata{
			Name: "perses",
		}}

	server, _, etcdClient := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	object, err := client.Project().Create(entity)
	assert.NoError(t, err)
	assert.Equal(t, object.Metadata.Name, entity.Metadata.Name)
	utils.ClearAllKeys(t, etcdClient)
}

func TestUpdateProject(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := &v1.Project{
		Kind: v1.KindProject,
		Metadata: v1.Metadata{
			Name: "perses",
		}}

	server, _, etcdClient := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	_, err := client.Project().Create(entity)
	assert.NoError(t, err)

	object, err := client.Project().Update(entity)
	assert.NoError(t, err)

	// for the moment the only thing to test is that the dates are correctly updated
	assert.True(t, object.Metadata.CreatedAt.UnixNano() < object.Metadata.UpdatedAt.UnixNano())

	utils.ClearAllKeys(t, etcdClient)
}

func TestGetProject(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := &v1.Project{
		Kind: v1.KindProject,
		Metadata: v1.Metadata{
			Name: "perses",
		}}
	server, _, etcdClient := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	_, err := client.Project().Create(entity)
	assert.NoError(t, err)
	object, err := client.Project().Get(entity.Metadata.Name)
	assert.NoError(t, err)
	assert.Equal(t, object.Metadata.Name, entity.Metadata.Name)

	utils.ClearAllKeys(t, etcdClient)
}

func TestDeleteProject(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := &v1.Project{
		Kind: v1.KindProject,
		Metadata: v1.Metadata{
			Name: "perses",
		}}
	server, _, _ := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	_, err := client.Project().Create(entity)
	assert.NoError(t, err)

	err = client.Project().Delete(entity.Metadata.Name)
	assert.NoError(t, err)
}
