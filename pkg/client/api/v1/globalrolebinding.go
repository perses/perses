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

const globalRoleBindingResource = "globalrolebindings"

type GlobalRoleBindingInterface interface {
	Create(entity *v1.GlobalRoleBinding) (*v1.GlobalRoleBinding, error)
	Update(entity *v1.GlobalRoleBinding) (*v1.GlobalRoleBinding, error)
	Delete(name string) error
	// Get is returning an unique GlobalRoleBinding.
	// As such name is the exact value of GlobalRoleBinding.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.GlobalRoleBinding, error)
	// prefix is a prefix of the GlobalRoleBinding.metadata.name to search for.
	// It can be empty in case you want to get the full list of GlobalRoleBinding available
	List(prefix string) ([]*v1.GlobalRoleBinding, error)
}

type globalRoleBinding struct {
	GlobalRoleBindingInterface
	client *perseshttp.RESTClient
}

func newGlobalRoleBinding(client *perseshttp.RESTClient) GlobalRoleBindingInterface {
	return &globalRoleBinding{
		client: client,
	}
}

func (c *globalRoleBinding) Create(entity *v1.GlobalRoleBinding) (*v1.GlobalRoleBinding, error) {
	result := &v1.GlobalRoleBinding{}
	err := c.client.Post().
		Resource(globalRoleBindingResource).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *globalRoleBinding) Update(entity *v1.GlobalRoleBinding) (*v1.GlobalRoleBinding, error) {
	result := &v1.GlobalRoleBinding{}
	err := c.client.Put().
		Resource(globalRoleBindingResource).
		Name(entity.Metadata.Name).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *globalRoleBinding) Delete(name string) error {
	return c.client.Delete().
		Resource(globalRoleBindingResource).
		Name(name).
		Do().
		Error()
}

func (c *globalRoleBinding) Get(name string) (*v1.GlobalRoleBinding, error) {
	result := &v1.GlobalRoleBinding{}
	err := c.client.Get().
		Resource(globalRoleBindingResource).
		Name(name).
		Do().
		Object(result)
	return result, err
}

func (c *globalRoleBinding) List(prefix string) ([]*v1.GlobalRoleBinding, error) {
	var result []*v1.GlobalRoleBinding
	err := c.client.Get().
		Resource(globalRoleBindingResource).
		Query(&query{
			name: prefix,
		}).
		Do().
		Object(&result)
	return result, err
}
