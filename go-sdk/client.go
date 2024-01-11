// Copyright 2024 The Perses Authors
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

package sdk

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/perses/perses/internal/cli/cmd/apply"
	"github.com/perses/perses/internal/cli/resource"
	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/client/perseshttp"
)

func NewClient(persesURL string) (*Client, error) {
	u, err := url.Parse(persesURL)
	if err != nil {
		return nil, err
	}

	return &Client{
		client: api.NewWithClient(&perseshttp.RESTClient{
			BaseURL: u,
			Client:  http.DefaultClient,
		}),
	}, nil
}

func NewClientBuilder(client api.ClientInterface) (*Client, error) {
	if client == nil {
		return nil, fmt.Errorf("client can't be empty")
	}
	return &Client{
		client: client,
	}, nil
}

type Client struct {
	client api.ClientInterface
}

func (c *Client) AuthWithUserPassword(username string, password string) (*Client, error) {
	token, err := c.client.Auth().Login(username, password)
	if err != nil {
		return c, err
	}
	c.client.RESTClient().SetToken(token.AccessToken)
	return c, nil
}

func (c *Client) AuthWithAccessToken(accessToken string) (*Client, error) {
	c.client.RESTClient().SetToken(accessToken)
	return c, nil
}

func (c *Client) Upsert(builder EntityBuilder) error {
	project := resource.GetProject(builder.GetEntity().GetMetadata(), "")
	if err := apply.SaveEntity(builder.GetEntity(), project, c.client); err != nil {
		return err
	}
	return nil
}

func (c *Client) UpsertToProject(builder EntityBuilder, projectName string) error {
	project := resource.GetProject(builder.GetEntity().GetMetadata(), projectName)
	if err := apply.SaveEntity(builder.GetEntity(), project, c.client); err != nil {
		return err
	}
	return nil
}

// TODO: create, update, delete
