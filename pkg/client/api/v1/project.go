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
