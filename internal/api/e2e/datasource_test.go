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

func TestCreateDatasource(t *testing.T) {
	entity := utils.NewDatasource(t)
	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	// perform the POST request, no error should occur at this point
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathDatasource)).
		WithJSON(entity).
		Expect().
		Status(http.StatusOK)

	// check the document exists in the db
	_, err := persistenceManager.GetDatasource().Get(entity.Metadata.Name)
	assert.NoError(t, err)
	utils.ClearAllKeys(t, persistenceManager.GetPersesDAO(), entity.GenerateID())
}

func TestCreateDatasourceWithConflict(t *testing.T) {
	entity := utils.NewDatasource(t)

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	// recall the same endpoint, it should now return a conflict error
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathDatasource)).
		WithJSON(entity).
		Expect().
		Status(http.StatusConflict)

	utils.ClearAllKeys(t, persistenceManager.GetPersesDAO(), entity.GenerateID())
}

func TestCreateDatasourceBadRequest(t *testing.T) {
	project := &v1.Datasource{Kind: v1.KindDatasource}

	server, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	// metadata.name is not provided, it should return a bad request
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathDatasource)).
		WithJSON(project).
		Expect().
		Status(http.StatusBadRequest)
}

func TestUpdateDatasource(t *testing.T) {
	entity := utils.NewDatasource(t)

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	// call now the update endpoint, shouldn't return an error
	o := e.PUT(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathDatasource, entity.Metadata.Name)).
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
	result := &v1.Datasource{}
	if err := json.Unmarshal(raw, result); err != nil {
		t.Fatal(err)
	}

	// for the moment the only thing to test is that the dates are correctly updated
	assert.True(t, result.Metadata.CreatedAt.UnixNano() < result.Metadata.UpdatedAt.UnixNano())

	// check the document exists in the db
	_, err = persistenceManager.GetDatasource().Get(entity.Metadata.Name)
	assert.NoError(t, err)

	utils.ClearAllKeys(t, persistenceManager.GetPersesDAO(), entity.GenerateID())
}

func TestUpdateDatasourceNotFound(t *testing.T) {
	entity := utils.NewDatasource(t)
	server, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.PUT(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathDatasource, entity.Metadata.Name)).
		WithJSON(entity).
		Expect().
		Status(http.StatusNotFound)
}

func TestUpdateDatasourceBadRequest(t *testing.T) {
	entity := utils.NewDatasource(t)
	server, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	// the name in the metadata and the name in the path doesn't match, it should return a bad request
	e.PUT(fmt.Sprintf("%s/%s/otherProject", shared.APIV1Prefix, shared.PathDatasource)).
		WithJSON(entity).
		Expect().
		Status(http.StatusBadRequest)
}

func TestGetDatasource(t *testing.T) {
	entity := utils.NewDatasource(t)
	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	e.GET(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathDatasource, entity.Metadata.Name)).
		Expect().
		Status(http.StatusOK)

	utils.ClearAllKeys(t, persistenceManager.GetPersesDAO(), entity.GenerateID())
}

func TestGetDatasourceNotFound(t *testing.T) {
	server, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.GET(fmt.Sprintf("%s/%s/perses", shared.APIV1Prefix, shared.PathDatasource)).
		Expect().
		Status(http.StatusNotFound)
}

func TestDeleteDatasource(t *testing.T) {
	entity := utils.NewDatasource(t)
	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	e.DELETE(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathDatasource, entity.Metadata.Name)).
		Expect().
		Status(http.StatusNoContent)

	e.GET(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathDatasource, entity.Metadata.Name)).
		Expect().
		Status(http.StatusNotFound)
}

func TestDeleteDatasourceNotFound(t *testing.T) {
	server, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.DELETE(fmt.Sprintf("%s/%s/perses", shared.APIV1Prefix, shared.PathDatasource)).
		Expect().
		Status(http.StatusNotFound)
}

func TestListDatasource(t *testing.T) {
	entity := utils.NewDatasource(t)
	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	if err := persistenceManager.GetDatasource().Update(entity); err != nil {
		t.Fatal(err)
	}

	e.GET(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathDatasource)).
		Expect().
		Status(http.StatusOK)
	utils.ClearAllKeys(t, persistenceManager.GetPersesDAO(), entity.GenerateID())
}
