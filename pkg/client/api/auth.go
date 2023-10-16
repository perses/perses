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

package api

import (
	"github.com/perses/perses/pkg/client/perseshttp"
	"github.com/perses/perses/pkg/model/api"
)

const authResource = "auth"

// AuthInterface has methods to work with Auth resource
type AuthInterface interface {
	Login(user, password string) (string, error)
}

func newAuth(client *perseshttp.RESTClient) AuthInterface {
	return &auth{client: client}
}

// paas implements PaasInterface
type auth struct {
	AuthInterface
	client *perseshttp.RESTClient
}

func (c *auth) Login(user string, password string) (string, error) {
	body := &api.Auth{
		Login:    user,
		Password: password,
	}
	result := &api.AuthResponse{}

	err := c.client.Post().
		APIVersion("").
		Resource(authResource).
		Body(body).
		Do().
		Object(result)

	if err != nil {
		return "", err
	}

	return result.Token, nil
}
