// Copyright 2022 The Perses Authors
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

// Package fake_api is reproducing the package api at the same level.
// This should be used only for the test and for the regular code.
// It is useful when you want to inject a fake client like you would do with a mock.
// But in this case a mock would be too painful to inject (too many methods / interfaces to mock)
package fake_api

import (
	"github.com/perses/perses/pkg/client/api"
	v1 "github.com/perses/perses/pkg/client/api/v1"
	"github.com/perses/perses/pkg/client/fake_api/fake_v1"
	"github.com/perses/perses/pkg/client/perseshttp"
)

type client struct {
	api.ClientInterface
}

func New() api.ClientInterface {
	return &client{}
}

func (c *client) RESTClient() *perseshttp.RESTClient {
	return nil
}

func (c *client) V1() v1.ClientInterface {
	return fake_v1.New()
}
