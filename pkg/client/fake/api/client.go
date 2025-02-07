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

// Package fakeapi is reproducing the package api at the same level.
// This should be used only for the test and for the regular code.
// It is useful when you want to inject a fake client like you would do with a mock.
// But in this case, a mock would be too painful to inject (too many methods / interfaces to mock)
package fakeapi

import (
	"github.com/perses/perses/pkg/client/api"
	v1 "github.com/perses/perses/pkg/client/api/v1"
	"github.com/perses/perses/pkg/client/config"
	"github.com/perses/perses/pkg/client/fake/api/v1"
	"github.com/perses/perses/pkg/client/perseshttp"
	apiConfig "github.com/perses/perses/pkg/model/api/config"
	"github.com/perses/perses/pkg/model/api/v1/common"
)

type client struct {
	api.ClientInterface
	restClient *perseshttp.RESTClient
}

func New() api.ClientInterface {
	restClient, _ := config.NewRESTClient(config.RestConfigClient{
		URL: common.MustParseURL("http://localhost:8080"),
	})
	return &client{
		restClient: restClient,
	}
}

func (c *client) RESTClient() *perseshttp.RESTClient {
	return c.restClient
}

func (c *client) V1() v1.ClientInterface {
	return fakev1.New(c.restClient)
}

func (c *client) Config() (*apiConfig.Config, error) {
	return &apiConfig.Config{
		Security: apiConfig.Security{
			EnableAuth: true,
		},
		Database:     apiConfig.Database{},
		Provisioning: apiConfig.ProvisioningConfig{},
		Frontend:     apiConfig.Frontend{},
	}, nil
}
