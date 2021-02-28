// +build integration

package core

import (
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
