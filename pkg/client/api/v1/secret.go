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

const secretResource = "secrets"

type SecretInterface interface {
	Create(entity *v1.Secret) (*v1.Secret, error)
	Update(entity *v1.Secret) (*v1.Secret, error)
	Delete(name string) error
	// Get is returning an unique Secret.
	// As such name is the exact value of Secret.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.Secret, error)
	// prefix is a prefix of the Secret.metadata.name to search for.
	// It can be empty in case you want to get the full list of Secret available
	List(prefix string) ([]*v1.Secret, error)
}

type secret struct {
	SecretInterface
	client  *perseshttp.RESTClient
	project string
}

func newSecret(client *perseshttp.RESTClient, project string) SecretInterface {
	return &secret{
		client:  client,
		project: project,
	}
}

func (c *secret) Create(entity *v1.Secret) (*v1.Secret, error) {
	result := &v1.Secret{}
	err := c.client.Post().
		Resource(secretResource).
		Project(c.project).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *secret) Update(entity *v1.Secret) (*v1.Secret, error) {
	result := &v1.Secret{}
	err := c.client.Put().
		Resource(secretResource).
		Name(entity.Metadata.Name).
		Project(c.project).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *secret) Delete(name string) error {
	return c.client.Delete().
		Resource(secretResource).
		Name(name).
		Project(c.project).
		Do().
		Error()
}

func (c *secret) Get(name string) (*v1.Secret, error) {
	result := &v1.Secret{}
	err := c.client.Get().
		Resource(secretResource).
		Name(name).
		Project(c.project).
		Do().
		Object(result)
	return result, err
}

func (c *secret) List(prefix string) ([]*v1.Secret, error) {
	var result []*v1.Secret
	err := c.client.Get().
		Resource(secretResource).
		Query(&query{
			name: prefix,
		}).
		Project(c.project).
		Do().
		Object(&result)
	return result, err
}
