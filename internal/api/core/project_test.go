// +build integration

package core

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/shared"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

func TestCreateProject(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}

	server, persistenceManager := createServer(t)
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
	clearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestCreateProjectWithConflict(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}

	server, persistenceManager := createServer(t)
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

	clearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestCreateProjectBadRequest(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
	}}

	server, _ := createServer(t)
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

	server, persistenceManager := createServer(t)
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

	clearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestUpdateProjectNotFound(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}
	server, persistenceManager := createServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.PUT(fmt.Sprintf("%s/%s/perses", shared.APIV1Prefix, shared.PathProject)).
		WithJSON(project).
		Expect().
		Status(http.StatusNotFound)

	clearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestUpdateProjectBadRequest(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}
	server, persistenceManager := createServer(t)
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

	clearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestGetProject(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}
	server, persistenceManager := createServer(t)
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

	clearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestGetProjectNotFound(t *testing.T) {
	server, _ := createServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.GET(fmt.Sprintf("%s/%s/perses", shared.APIV1Prefix, shared.PathProject)).
		Expect().
		Status(http.StatusNotFound)
}
