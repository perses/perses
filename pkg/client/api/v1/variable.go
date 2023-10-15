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

const variableResource = "variables"

type VariableInterface interface {
	Create(entity *v1.Variable) (*v1.Variable, error)
	Update(entity *v1.Variable) (*v1.Variable, error)
	Delete(name string) error
	// Get is returning an unique Variable.
	// As such name is the exact value of Variable.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.Variable, error)
	// prefix is a prefix of the Variable.metadata.name to search for.
	// It can be empty in case you want to get the full list of Variable available
	List(prefix string) ([]*v1.Variable, error)
}

type variable struct {
	VariableInterface
	client  *perseshttp.RESTClient
	project string
}

func newVariable(client *perseshttp.RESTClient, project string) VariableInterface {
	return &variable{
		client:  client,
		project: project,
	}
}

func (c *variable) Create(entity *v1.Variable) (*v1.Variable, error) {
	result := &v1.Variable{}
	err := c.client.Post().
		Resource(variableResource).
		Project(c.project).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *variable) Update(entity *v1.Variable) (*v1.Variable, error) {
	result := &v1.Variable{}
	err := c.client.Put().
		Resource(variableResource).
		Name(entity.Metadata.Name).
		Project(c.project).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *variable) Delete(name string) error {
	return c.client.Delete().
		Resource(variableResource).
		Name(name).
		Project(c.project).
		Do().
		Error()
}

func (c *variable) Get(name string) (*v1.Variable, error) {
	result := &v1.Variable{}
	err := c.client.Get().
		Resource(variableResource).
		Name(name).
		Project(c.project).
		Do().
		Object(result)
	return result, err
}

func (c *variable) List(prefix string) ([]*v1.Variable, error) {
	var result []*v1.Variable
	err := c.client.Get().
		Resource(variableResource).
		Query(&query{
			name: prefix,
		}).
		Project(c.project).
		Do().
		Object(&result)
	return result, err
}
