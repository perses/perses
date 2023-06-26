// Copyright 2021 The Perses Authors
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

const globalVariableResource = "globalvariables"

type GlobalVariableInterface interface {
	Create(entity *v1.GlobalVariable) (*v1.GlobalVariable, error)
	Update(entity *v1.GlobalVariable) (*v1.GlobalVariable, error)
	Delete(name string) error
	// Get is returning an unique GlobalVariable.
	// As such name is the exact value of GlobalVariable.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.GlobalVariable, error)
	// prefix is a prefix of the GlobalVariable.metadata.name to search for.
	// It can be empty in case you want to get the full list of GlobalVariable available
	List(prefix string) ([]*v1.GlobalVariable, error)
}

type globalVariable struct {
	GlobalVariableInterface
	client *perseshttp.RESTClient
}

func newGlobalVariable(client *perseshttp.RESTClient) GlobalVariableInterface {
	return &globalVariable{
		client: client,
	}
}

func (c *globalVariable) Create(entity *v1.GlobalVariable) (*v1.GlobalVariable, error) {
	result := &v1.GlobalVariable{}
	err := c.client.Post().
		Resource(globalVariableResource).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *globalVariable) Update(entity *v1.GlobalVariable) (*v1.GlobalVariable, error) {
	result := &v1.GlobalVariable{}
	err := c.client.Put().
		Resource(globalVariableResource).
		Name(entity.Metadata.Name).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *globalVariable) Delete(name string) error {
	return c.client.Delete().
		Resource(globalVariableResource).
		Name(name).
		Do().
		Error()
}

func (c *globalVariable) Get(name string) (*v1.GlobalVariable, error) {
	result := &v1.GlobalVariable{}
	err := c.client.Get().
		Resource(globalVariableResource).
		Name(name).
		Do().
		Object(result)
	return result, err
}

func (c *globalVariable) List(prefix string) ([]*v1.GlobalVariable, error) {
	var result []*v1.GlobalVariable
	err := c.client.Get().
		Resource(globalVariableResource).
		Query(&query{
			name: prefix,
		}).
		Do().
		Object(&result)
	return result, err
}
