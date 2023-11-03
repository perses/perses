// Copyright 2023 The Perses Authors
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

// Code generated. DO NOT EDIT

package v1

import (
	"github.com/perses/perses/pkg/client/perseshttp"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

const roleResource = "roles"

type RoleInterface interface {
	Create(entity *v1.Role) (*v1.Role, error)
	Update(entity *v1.Role) (*v1.Role, error)
	Delete(name string) error
	// Get is returning an unique Role.
	// As such name is the exact value of Role.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.Role, error)
	// prefix is a prefix of the Role.metadata.name to search for.
	// It can be empty in case you want to get the full list of Role available
	List(prefix string) ([]*v1.Role, error)
}

type role struct {
	RoleInterface
	client  *perseshttp.RESTClient
	project string
}

func newRole(client *perseshttp.RESTClient, project string) RoleInterface {
	return &role{
		client:  client,
		project: project,
	}
}

func (c *role) Create(entity *v1.Role) (*v1.Role, error) {
	result := &v1.Role{}
	err := c.client.Post().
		Resource(roleResource).
		Project(c.project).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *role) Update(entity *v1.Role) (*v1.Role, error) {
	result := &v1.Role{}
	err := c.client.Put().
		Resource(roleResource).
		Name(entity.Metadata.Name).
		Project(c.project).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *role) Delete(name string) error {
	return c.client.Delete().
		Resource(roleResource).
		Name(name).
		Project(c.project).
		Do().
		Error()
}

func (c *role) Get(name string) (*v1.Role, error) {
	result := &v1.Role{}
	err := c.client.Get().
		Resource(roleResource).
		Name(name).
		Project(c.project).
		Do().
		Object(result)
	return result, err
}

func (c *role) List(prefix string) ([]*v1.Role, error) {
	var result []*v1.Role
	err := c.client.Get().
		Resource(roleResource).
		Query(&query{
			name: prefix,
		}).
		Project(c.project).
		Do().
		Object(&result)
	return result, err
}
