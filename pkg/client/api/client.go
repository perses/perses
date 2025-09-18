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

package api

import (
	"github.com/perses/perses/pkg/client/api/auth"
	v1 "github.com/perses/perses/pkg/client/api/v1"
	"github.com/perses/perses/pkg/client/api/validate"
	"github.com/perses/perses/pkg/client/perseshttp"
	"github.com/perses/perses/pkg/model/api"
	apiConfig "github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

type ClientInterface interface {
	RESTClient() *perseshttp.RESTClient
	V1() v1.ClientInterface
	Migrate(body *api.Migrate) (*modelV1.Dashboard, error)
	Validate() validate.Interface
	Auth() auth.Interface
	Config() (*apiConfig.Config, error)
}

type client struct {
	ClientInterface
	restClient *perseshttp.RESTClient
}

func NewWithClient(restClient *perseshttp.RESTClient) ClientInterface {
	return &client{
		restClient: restClient,
	}
}

func (c *client) RESTClient() *perseshttp.RESTClient {
	return c.restClient
}

func (c *client) V1() v1.ClientInterface {
	return v1.NewWithClient(c.restClient)
}

func (c *client) Migrate(body *api.Migrate) (*modelV1.Dashboard, error) {
	result := &modelV1.Dashboard{}
	err := c.restClient.Post().
		APIVersion("").
		Resource("migrate").
		Body(body).
		Do().
		Object(result)

	return result, err
}

func (c *client) Validate() validate.Interface {
	return validate.New(c.restClient)
}

func (c *client) Auth() auth.Interface {
	return auth.New(c.restClient)
}

func (c *client) Config() (*apiConfig.Config, error) {
	cfg := &apiConfig.Config{}
	err := c.restClient.Get().
		APIVersion("").
		Resource("config").
		Do().
		Object(cfg)
	return cfg, err
}
