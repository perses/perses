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

const ephemeralDashboardResource = "ephemeraldashboards"

type EphemeralDashboardInterface interface {
	Create(entity *v1.EphemeralDashboard) (*v1.EphemeralDashboard, error)
	Update(entity *v1.EphemeralDashboard) (*v1.EphemeralDashboard, error)
	Delete(name string) error
	// Get is returning an unique EphemeralDashboard.
	// As such name is the exact value of EphemeralDashboard.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.EphemeralDashboard, error)
	// prefix is a prefix of the EphemeralDashboard.metadata.name to search for.
	// It can be empty in case you want to get the full list of EphemeralDashboard available
	List(prefix string) ([]*v1.EphemeralDashboard, error)
}

type ephemeralDashboard struct {
	EphemeralDashboardInterface
	client  *perseshttp.RESTClient
	project string
}

func newEphemeralDashboard(client *perseshttp.RESTClient, project string) EphemeralDashboardInterface {
	return &ephemeralDashboard{
		client:  client,
		project: project,
	}
}

func (c *ephemeralDashboard) Create(entity *v1.EphemeralDashboard) (*v1.EphemeralDashboard, error) {
	result := &v1.EphemeralDashboard{}
	err := c.client.Post().
		Resource(ephemeralDashboardResource).
		Project(c.project).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *ephemeralDashboard) Update(entity *v1.EphemeralDashboard) (*v1.EphemeralDashboard, error) {
	result := &v1.EphemeralDashboard{}
	err := c.client.Put().
		Resource(ephemeralDashboardResource).
		Name(entity.Metadata.Name).
		Project(c.project).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *ephemeralDashboard) Delete(name string) error {
	return c.client.Delete().
		Resource(ephemeralDashboardResource).
		Name(name).
		Project(c.project).
		Do().
		Error()
}

func (c *ephemeralDashboard) Get(name string) (*v1.EphemeralDashboard, error) {
	result := &v1.EphemeralDashboard{}
	err := c.client.Get().
		Resource(ephemeralDashboardResource).
		Name(name).
		Project(c.project).
		Do().
		Object(result)
	return result, err
}

func (c *ephemeralDashboard) List(prefix string) ([]*v1.EphemeralDashboard, error) {
	var result []*v1.EphemeralDashboard
	err := c.client.Get().
		Resource(ephemeralDashboardResource).
		Query(&query{
			name: prefix,
		}).
		Project(c.project).
		Do().
		Object(&result)
	return result, err
}
