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

const userResource = "users"

type UserInterface interface {
	Create(entity *v1.User) (*v1.User, error)
	Update(entity *v1.User) (*v1.User, error)
	Delete(name string) error
	// Get is returning an unique User.
	// As such name is the exact value of User.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.User, error)
	// prefix is a prefix of the User.metadata.name to search for.
	// It can be empty in case you want to get the full list of User available
	List(prefix string) ([]*v1.User, error)
}

type user struct {
	UserInterface
	client *perseshttp.RESTClient
}

func newUser(client *perseshttp.RESTClient) UserInterface {
	return &user{
		client: client,
	}
}

func (c *user) Create(entity *v1.User) (*v1.User, error) {
	result := &v1.User{}
	err := c.client.Post().
		Resource(userResource).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *user) Update(entity *v1.User) (*v1.User, error) {
	result := &v1.User{}
	err := c.client.Put().
		Resource(userResource).
		Name(entity.Metadata.Name).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *user) Delete(name string) error {
	return c.client.Delete().
		Resource(userResource).
		Name(name).
		Do().
		Error()
}

func (c *user) Get(name string) (*v1.User, error) {
	result := &v1.User{}
	err := c.client.Get().
		Resource(userResource).
		Name(name).
		Do().
		Object(result)
	return result, err
}

func (c *user) List(prefix string) ([]*v1.User, error) {
	var result []*v1.User
	err := c.client.Get().
		Resource(userResource).
		Query(&query{
			name: prefix,
		}).
		Do().
		Object(&result)
	return result, err
}
