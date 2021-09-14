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

const globalDatasourceResource = "globaldatasources"

type GlobalDatasourceInterface interface {
	Create(entity *v1.GlobalDatasource) (*v1.GlobalDatasource, error)
	Update(entity *v1.GlobalDatasource) (*v1.GlobalDatasource, error)
	Delete(name string) error
	// Get is returning an unique GlobalDatasource.
	// As such name is the exact value of GlobalDatasource.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.GlobalDatasource, error)
	// prefix is a prefix of the GlobalDatasource.metadata.name to search for.
	// It can be empty in case you want to get the full list of GlobalDatasource available
	List(prefix string) ([]*v1.GlobalDatasource, error)
}

type globalDatasource struct {
	GlobalDatasourceInterface
	client *perseshttp.RESTClient
}

func newGlobalDatasource(client *perseshttp.RESTClient) GlobalDatasourceInterface {
	return &globalDatasource{
		client: client,
	}
}

func (c *globalDatasource) Create(entity *v1.GlobalDatasource) (*v1.GlobalDatasource, error) {
	result := &v1.GlobalDatasource{}
	err := c.client.Post().
		Resource(globalDatasourceResource).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *globalDatasource) Update(entity *v1.GlobalDatasource) (*v1.GlobalDatasource, error) {
	result := &v1.GlobalDatasource{}
	err := c.client.Put().
		Resource(globalDatasourceResource).
		Name(entity.Metadata.Name).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *globalDatasource) Delete(name string) error {
	return c.client.Delete().
		Resource(globalDatasourceResource).
		Name(name).
		Do().
		Error()
}

func (c *globalDatasource) Get(name string) (*v1.GlobalDatasource, error) {
	result := &v1.GlobalDatasource{}
	err := c.client.Get().
		Resource(globalDatasourceResource).
		Name(name).
		Do().
		Object(result)
	return result, err
}

func (c *globalDatasource) List(prefix string) ([]*v1.GlobalDatasource, error) {
	var result []*v1.GlobalDatasource
	err := c.client.Get().
		Resource(globalDatasourceResource).
		Query(&query{
			name: prefix,
		}).
		Do().
		Object(&result)
	return result, err
}
