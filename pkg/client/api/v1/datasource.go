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

const datasourceResource = "datasources"

type DatasourceInterface interface {
	Create(entity *v1.Datasource) (*v1.Datasource, error)
	Update(entity *v1.Datasource) (*v1.Datasource, error)
	Delete(name string) error
	// Get is returning an unique Datasource.
	// As such name is the exact value of Datasource.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.Datasource, error)
	// prefix is a prefix of the Datasource.metadata.name to search for.
	// It can be empty in case you want to get the full list of Datasource available
	List(prefix string) ([]*v1.Datasource, error)
}

type datasource struct {
	DatasourceInterface
	client *perseshttp.RESTClient
}

func newDatasource(client *perseshttp.RESTClient) DatasourceInterface {
	return &datasource{
		client: client,
	}
}

func (c *datasource) Create(entity *v1.Datasource) (*v1.Datasource, error) {
	result := &v1.Datasource{}
	err := c.client.Post().
		Resource(datasourceResource).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *datasource) Update(entity *v1.Datasource) (*v1.Datasource, error) {
	result := &v1.Datasource{}
	err := c.client.Put().
		Resource(datasourceResource).
		Name(entity.Metadata.Name).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *datasource) Delete(name string) error {
	return c.client.Delete().
		Resource(datasourceResource).
		Name(name).
		Do().
		Error()
}

func (c *datasource) Get(name string) (*v1.Datasource, error) {
	result := &v1.Datasource{}
	err := c.client.Get().
		Resource(datasourceResource).
		Name(name).
		Do().
		Object(result)
	return result, err
}

func (c *datasource) List(prefix string) ([]*v1.Datasource, error) {
	var result []*v1.Datasource
	err := c.client.Get().
		Resource(datasourceResource).
		Query(&query{
			name: prefix,
		}).
		Do().
		Object(&result)
	return result, err
}
