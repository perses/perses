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

const globalSecretResource = "globalsecrets"

type GlobalSecretInterface interface {
	Create(entity *v1.GlobalSecret) (*v1.GlobalSecret, error)
	Update(entity *v1.GlobalSecret) (*v1.GlobalSecret, error)
	Delete(name string) error
	// Get is returning an unique GlobalSecret.
	// As such name is the exact value of GlobalSecret.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.GlobalSecret, error)
	// prefix is a prefix of the GlobalSecret.metadata.name to search for.
	// It can be empty in case you want to get the full list of GlobalSecret available
	List(prefix string) ([]*v1.GlobalSecret, error)
}

type globalSecret struct {
	GlobalSecretInterface
	client *perseshttp.RESTClient
}

func newGlobalSecret(client *perseshttp.RESTClient) GlobalSecretInterface {
	return &globalSecret{
		client: client,
	}
}

func (c *globalSecret) Create(entity *v1.GlobalSecret) (*v1.GlobalSecret, error) {
	result := &v1.GlobalSecret{}
	err := c.client.Post().
		Resource(globalSecretResource).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *globalSecret) Update(entity *v1.GlobalSecret) (*v1.GlobalSecret, error) {
	result := &v1.GlobalSecret{}
	err := c.client.Put().
		Resource(globalSecretResource).
		Name(entity.Metadata.Name).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *globalSecret) Delete(name string) error {
	return c.client.Delete().
		Resource(globalSecretResource).
		Name(name).
		Do().
		Error()
}

func (c *globalSecret) Get(name string) (*v1.GlobalSecret, error) {
	result := &v1.GlobalSecret{}
	err := c.client.Get().
		Resource(globalSecretResource).
		Name(name).
		Do().
		Object(result)
	return result, err
}

func (c *globalSecret) List(prefix string) ([]*v1.GlobalSecret, error) {
	var result []*v1.GlobalSecret
	err := c.client.Get().
		Resource(globalSecretResource).
		Query(&query{
			name: prefix,
		}).
		Do().
		Object(&result)
	return result, err
}
