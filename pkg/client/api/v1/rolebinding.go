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

const roleBindingResource = "rolebindings"

type RoleBindingInterface interface {
	Create(entity *v1.RoleBinding) (*v1.RoleBinding, error)
	Update(entity *v1.RoleBinding) (*v1.RoleBinding, error)
	Delete(name string) error
	// Get is returning an unique RoleBinding.
	// As such name is the exact value of RoleBinding.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.RoleBinding, error)
	// prefix is a prefix of the RoleBinding.metadata.name to search for.
	// It can be empty in case you want to get the full list of RoleBinding available
	List(prefix string) ([]*v1.RoleBinding, error)
}

type roleBinding struct {
	RoleBindingInterface
	client  *perseshttp.RESTClient
	project string
}

func newRoleBinding(client *perseshttp.RESTClient, project string) RoleBindingInterface {
	return &roleBinding{
		client:  client,
		project: project,
	}
}

func (c *roleBinding) Create(entity *v1.RoleBinding) (*v1.RoleBinding, error) {
	result := &v1.RoleBinding{}
	err := c.client.Post().
		Resource(roleBindingResource).
		Project(c.project).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *roleBinding) Update(entity *v1.RoleBinding) (*v1.RoleBinding, error) {
	result := &v1.RoleBinding{}
	err := c.client.Put().
		Resource(roleBindingResource).
		Name(entity.Metadata.Name).
		Project(c.project).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *roleBinding) Delete(name string) error {
	return c.client.Delete().
		Resource(roleBindingResource).
		Name(name).
		Project(c.project).
		Do().
		Error()
}

func (c *roleBinding) Get(name string) (*v1.RoleBinding, error) {
	result := &v1.RoleBinding{}
	err := c.client.Get().
		Resource(roleBindingResource).
		Name(name).
		Project(c.project).
		Do().
		Object(result)
	return result, err
}

func (c *roleBinding) List(prefix string) ([]*v1.RoleBinding, error) {
	var result []*v1.RoleBinding
	err := c.client.Get().
		Resource(roleBindingResource).
		Query(&query{
			name: prefix,
		}).
		Project(c.project).
		Do().
		Object(&result)
	return result, err
}
