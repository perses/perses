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
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	// perform the POST request, no error should occur at this point
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(project).
		Expect().
		Status(http.StatusOK)

	// check the document exists in the db
	_, err := persistenceManager.GetProject().Get(project.Metadata.Name)
	assert.NoError(t, err)
	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestCreateProjectWithConflict(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	// perform the POST request, no error should occur at this point
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(project).
		Expect().
		Status(http.StatusOK)

	// recall the same endpoint, it should now return a conflict error
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(project).
		Expect().
		Status(http.StatusConflict)

	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestCreateProjectBadRequest(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
	}}

	server, _ := utils.CreateServer(t)
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
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	// perform the POST request, no error should occur at this point
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(project).
		Expect().
		Status(http.StatusOK)

	// call now the update endpoint, shouldn't return an error
	o := e.PUT(fmt.Sprintf("%s/%s/perses", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(project).
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
	_, err = persistenceManager.GetProject().Get(project.Metadata.Name)
	assert.NoError(t, err)

	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestUpdateProjectNotFound(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}
	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.PUT(fmt.Sprintf("%s/%s/perses", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(project).
		Expect().
		Status(http.StatusNotFound)

	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestUpdateProjectBadRequest(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}
	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	// the name in the metadata and the name in the path doesn't match, it should return a bad request
	e.PUT(fmt.Sprintf("%s/%s/otherProject", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(project).
		Expect().
		Status(http.StatusBadRequest)

	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestGetProject(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}
	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(project).
		Expect().
		Status(http.StatusOK)

	e.GET(fmt.Sprintf("%s/%s/perses", shared.APIV1Prefix, shared.PathProject)).
		Expect().
		Status(http.StatusOK)

	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestGetProjectNotFound(t *testing.T) {
	server, _ := utils.CreateServer(t)
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
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}
	server, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(project).
		Expect().
		Status(http.StatusOK)

	e.DELETE(fmt.Sprintf("%s/%s/perses", shared.APIV1Prefix, shared.PathProject)).
		Expect().
		Status(http.StatusNoContent)
}

func TestDeleteProjectNotFound(t *testing.T) {
	server, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.DELETE(fmt.Sprintf("%s/%s/perses", shared.APIV1Prefix, shared.PathProject)).
		Expect().
		Status(http.StatusNotFound)
}
