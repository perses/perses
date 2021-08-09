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

const dashboardResource = "dashboards"

type DashboardInterface interface {
	Create(entity *v1.Dashboard) (*v1.Dashboard, error)
	Update(entity *v1.Dashboard) (*v1.Dashboard, error)
	Delete(name string) error
	// Get is returning an unique Dashboard.
	// As such name is the exact value of Dashboard.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.Dashboard, error)
	// prefix is a prefix of the Dashboard.metadata.name to search for.
	// It can be empty in case you want to get the full list of Dashboard available
	List(prefix string) ([]*v1.Dashboard, error)
}

type dashboard struct {
	DashboardInterface
	client  *perseshttp.RESTClient
	project string
}

func newDashboard(client *perseshttp.RESTClient, project string) DashboardInterface {
	return &dashboard{
		client:  client,
		project: project,
	}
}

func (c *dashboard) Create(entity *v1.Dashboard) (*v1.Dashboard, error) {
	result := &v1.Dashboard{}
	err := c.client.Post().
		Resource(dashboardResource).
		Project(c.project).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *dashboard) Update(entity *v1.Dashboard) (*v1.Dashboard, error) {
	result := &v1.Dashboard{}
	err := c.client.Put().
		Resource(dashboardResource).
		Name(entity.Metadata.Name).
		Project(c.project).
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *dashboard) Delete(name string) error {
	return c.client.Delete().
		Resource(dashboardResource).
		Name(name).
		Project(c.project).
		Do().
		Error()
}

func (c *dashboard) Get(name string) (*v1.Dashboard, error) {
	result := &v1.Dashboard{}
	err := c.client.Get().
		Resource(dashboardResource).
		Name(name).
		Project(c.project).
		Do().
		Object(result)
	return result, err
}

func (c *dashboard) List(prefix string) ([]*v1.Dashboard, error) {
	var result []*v1.Dashboard
	err := c.client.Get().
		Resource(dashboardResource).
		Query(&query{
			name: prefix,
		}).
		Project(c.project).
		Do().
		Object(&result)
	return result, err
}
