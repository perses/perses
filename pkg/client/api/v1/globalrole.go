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

const globalRoleResource = "globalroles"

type GlobalRoleInterface interface {
	Create(entity *v1.GlobalRole) (*v1.GlobalRole, error)
	Update(entity *v1.GlobalRole) (*v1.GlobalRole, error)
	Delete(name string) error
	// Get is returning an unique GlobalRole.
	// As such name is the exact value of GlobalRole.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.GlobalRole, error)
	// prefix is a prefix of the GlobalRole.metadata.name to search for.
	// It can be empty in case you want to get the full list of GlobalRole available
	List(prefix string) ([]*v1.GlobalRole, error)
}

type globalRole struct {
	GlobalRoleInterface
	client *perseshttp.RESTClient
}

func newGlobalRole(client *perseshttp.RESTClient) GlobalRoleInterface {
	return &globalRole{
		client: client,
	}
}

func (c *globalRole) Create(entity *v1.GlobalRole) (*v1.GlobalRole, error) {
	result := &v1.GlobalRole{}
	err := c.client.Post().
		Resource(globalRoleResource).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *globalRole) Update(entity *v1.GlobalRole) (*v1.GlobalRole, error) {
	result := &v1.GlobalRole{}
	err := c.client.Put().
		Resource(globalRoleResource).
		Name(entity.Metadata.Name).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *globalRole) Delete(name string) error {
	return c.client.Delete().
		Resource(globalRoleResource).
		Name(name).
		Do().
		Error()
}

func (c *globalRole) Get(name string) (*v1.GlobalRole, error) {
	result := &v1.GlobalRole{}
	err := c.client.Get().
		Resource(globalRoleResource).
		Name(name).
		Do().
		Object(result)
	return result, err
}

func (c *globalRole) List(prefix string) ([]*v1.GlobalRole, error) {
	var result []*v1.GlobalRole
	err := c.client.Get().
		Resource(globalRoleResource).
		Query(&query{
			name: prefix,
		}).
		Do().
		Object(&result)
	return result, err
}
