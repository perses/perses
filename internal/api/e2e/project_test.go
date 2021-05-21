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

package e2e

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/shared"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/utils"
	"github.com/stretchr/testify/assert"
)

func TestCreateProject(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewProject()

	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	// perform the POST request, no error should occur at this point
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(entity).
		Expect().
		Status(http.StatusOK)

	utils.WaitUntilEntityIsCreate(t, persistenceManager, entity)
	// check the document exists in the db
	_, err := persistenceManager.GetProject().Get(entity.Metadata.Name)
	assert.NoError(t, err)
	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestCreateProjectWithConflict(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewProject()

	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	if err := persistenceManager.GetProject().Update(entity); err != nil {
		t.Fatal(err)
	}

	utils.WaitUntilEntityIsCreate(t, persistenceManager, entity)

	// recall the same endpoint, it should now return a conflict error
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(entity).
		Expect().
		Status(http.StatusConflict)

	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestCreateProjectBadRequest(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	project := &v1.Project{Kind: v1.KindProject}

	server, _, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	// metadata.name is not provided, it should return a bad request
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(project).
		Expect().
		Status(http.StatusBadRequest)
}

func TestUpdateProject(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewProject()

	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	// perform the POST request, no error should occur at this point
	if err := persistenceManager.GetProject().Update(entity); err != nil {
		t.Fatal(err)
	}

	utils.WaitUntilEntityIsCreate(t, persistenceManager, entity)

	// call now the update endpoint, shouldn't return an error
	o := e.PUT(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathProject, entity.Metadata.Name)).
		WithJSON(entity).
		Expect().
		Status(http.StatusOK).
		JSON().Raw()

	// To be able to compare the result, an easy is to convert the map returned by the test framework.
	// So for that we have to first marshal again the data
	raw, err := json.Marshal(o)
	if err != nil {
		t.Fatal(err)
	}
	result := &v1.Project{}
	if err := json.Unmarshal(raw, result); err != nil {
		t.Fatal(err)
	}

	// for the moment the only thing to test is that the dates are correctly updated
	assert.True(t, result.Metadata.CreatedAt.UnixNano() < result.Metadata.UpdatedAt.UnixNano())

	// check the document exists in the db
	_, err = persistenceManager.GetProject().Get(entity.Metadata.Name)
	assert.NoError(t, err)

	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestUpdateProjectNotFound(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewProject()
	server, _, etcdClient := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.PUT(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathProject, entity.Metadata.Name)).
		WithJSON(entity).
		Expect().
		Status(http.StatusNotFound)

	utils.ClearAllKeys(t, etcdClient)
}

func TestUpdateProjectBadRequest(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewProject()
	server, _, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	// the name in the metadata and the name in the path doesn't match, it should return a bad request
	e.PUT(fmt.Sprintf("%s/%s/otherProject", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(entity).
		Expect().
		Status(http.StatusBadRequest)
}

func TestGetProject(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewProject()
	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	if err := persistenceManager.GetProject().Update(entity); err != nil {
		t.Fatal(err)
	}

	utils.WaitUntilEntityIsCreate(t, persistenceManager, entity)

	e.GET(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathProject, entity.Metadata.Name)).
		Expect().
		Status(http.StatusOK)

	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestGetProjectNotFound(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	server, _, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.GET(fmt.Sprintf("%s/%s/perses", shared.APIV1Prefix, shared.PathProject)).
		Expect().
		Status(http.StatusNotFound)
}

func TestDeleteProject(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewProject()
	server, persistenceManager, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	if err := persistenceManager.GetProject().Update(entity); err != nil {
		t.Fatal(err)
	}

	utils.WaitUntilEntityIsCreate(t, persistenceManager, entity)

	e.DELETE(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathProject, entity.Metadata.Name)).
		Expect().
		Status(http.StatusNoContent)

	e.GET(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathProject, entity.Metadata.Name)).
		Expect().
		Status(http.StatusNotFound)
}

func TestDeleteProjectNotFound(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	server, _, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.DELETE(fmt.Sprintf("%s/%s/perses", shared.APIV1Prefix, shared.PathProject)).
		Expect().
		Status(http.StatusNotFound)
}

func TestListProject(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewProject()
	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	if err := persistenceManager.GetProject().Update(entity); err != nil {
		t.Fatal(err)
	}

	utils.WaitUntilEntityIsCreate(t, persistenceManager, entity)

	e.GET(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathProject)).
		Expect().
		Status(http.StatusOK)
	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}
