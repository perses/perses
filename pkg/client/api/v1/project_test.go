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
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	object, err := client.Project().Create(project)
	assert.NoError(t, err)
	assert.Equal(t, object.Metadata.Name, project.Metadata.Name)
	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestUpdateProject(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}

	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	_, err := client.Project().Create(project)
	assert.NoError(t, err)

	object, err := client.Project().Update(project)
	assert.NoError(t, err)

	// for the moment the only thing to test is that the dates are correctly updated
	assert.True(t, object.Metadata.CreatedAt.UnixNano() < object.Metadata.UpdatedAt.UnixNano())

	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestGetProject(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}
	server, persistenceManager := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	_, err := client.Project().Create(project)
	assert.NoError(t, err)
	object, err := client.Project().Get(project.Metadata.Name)
	assert.NoError(t, err)
	assert.Equal(t, object.Metadata.Name, project.Metadata.Name)

	utils.ClearAllKeys(t, persistenceManager.GetETCDClient())
}

func TestDeleteProject(t *testing.T) {
	project := &v1.Project{Metadata: v1.Metadata{
		Kind: v1.KindProject,
		Name: "perses",
	}}
	server, _ := utils.CreateServer(t)
	defer server.Close()
	client := createClient(t, server)

	_, err := client.Project().Create(project)
	assert.NoError(t, err)

	err = client.Project().Delete(project.Metadata.Name)
	assert.NoError(t, err)
}
