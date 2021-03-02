package v1

import (
	"github.com/perses/perses/pkg/client/perseshttp"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

const projectResource = "projects"

type ProjectInterface interface {
	Create(entity *v1.Project) (*v1.Project, error)
	Update(entity *v1.Project) (*v1.Project, error)
	Delete(name string) error
	Get(name string) (*v1.Project, error)
}

type project struct {
	ProjectInterface
	client *perseshttp.RESTClient
}

func newProject(client *perseshttp.RESTClient) ProjectInterface {
	return &project{
		client: client,
	}
}

func (c *project) Create(entity *v1.Project) (*v1.Project, error) {
	result := &v1.Project{}
	err := c.client.Post().
		Resource(projectResource).
		Body(entity).
		Do().
		Object(result)
	return result, err
}
func (c *project) Update(entity *v1.Project) (*v1.Project, error) {
	result := &v1.Project{}
	err := c.client.Put().
		Resource(projectResource).
		Name(entity.Metadata.Name).
		Body(entity).
		Do().
		Object(result)
	return result, err
}
func (c *project) Delete(name string) error {
	return c.client.Delete().
		Resource(projectResource).
		Name(name).
		Do().
		Error()
}
func (c *project) Get(name string) (*v1.Project, error) {
	result := &v1.Project{}
	err := c.client.Get().
		Resource(projectResource).
		Name(name).
		Do().
		Object(result)
	return result, err
}
