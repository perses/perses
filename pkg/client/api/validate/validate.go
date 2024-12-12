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

package validate

import (
	"github.com/perses/perses/pkg/client/perseshttp"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Interface interface {
	Dashboard(entity *v1.Dashboard) error
	Datasource(entity *v1.Datasource) error
	GlobalDatasource(entity *v1.GlobalDatasource) error
	Variable(entity *v1.Variable) error
	GlobalVariable(entity *v1.GlobalVariable) error
}

type validate struct {
	Interface
	client *perseshttp.RESTClient
}

func New(client *perseshttp.RESTClient) Interface {
	return &validate{client: client}
}

func (c *validate) Dashboard(entity *v1.Dashboard) error {
	return c.client.Post().
		APIVersion("").
		Resource("validate/dashboards").
		Body(entity).
		Do().
		Error()
}
func (c *validate) Datasource(entity *v1.Datasource) error {
	return c.client.Post().
		APIVersion("").
		Resource("validate/datasources").
		Body(entity).
		Do().
		Error()
}
func (c *validate) GlobalDatasource(entity *v1.GlobalDatasource) error {
	return c.client.Post().
		APIVersion("").
		Resource("validate/globaldatasources").
		Body(entity).
		Do().
		Error()
}

func (c *validate) Variable(entity *v1.Variable) error {
	return c.client.Post().
		APIVersion("").
		Resource("validate/variables").
		Body(entity).
		Do().
		Error()
}
func (c *validate) GlobalVariable(entity *v1.GlobalVariable) error {
	return c.client.Post().
		APIVersion("").
		Resource("validate/globalvariables").
		Body(entity).
		Do().
		Error()
}
