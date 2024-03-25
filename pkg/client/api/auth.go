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
	"fmt"

	"github.com/perses/perses/pkg/client/perseshttp"
	"github.com/perses/perses/pkg/model/api"
	"golang.org/x/oauth2"
)

const authResource = "auth"

// AuthInterface has methods to work with Auth resource
type AuthInterface interface {
	Login(user, password string) (*api.AuthResponse, error)
	Refresh(refreshToken string) (*api.AuthResponse, error)
	DeviceCode(authKind, authProvider string) (*oauth2.DeviceAuthResponse, error)
	DeviceAccessToken(authKind, slugID, deviceCode string) (*api.AuthResponse, error)
	ClientCredentialsToken(authKind, slugID, clientID, clientSecret string) (*api.AuthResponse, error)
}

func newAuth(client *perseshttp.RESTClient) AuthInterface {
	return &auth{client: client}
}

// auth implements AuthInterface
type auth struct {
	AuthInterface
	client *perseshttp.RESTClient
}

func (c *auth) Login(user string, password string) (*api.AuthResponse, error) {
	body := &api.Auth{
		Login:    user,
		Password: password,
	}
	result := &api.AuthResponse{}

	return result, c.client.Post().
		APIVersion("").
		Resource(fmt.Sprintf("%s/%s", authResource, "providers/native/login")).
		Body(body).
		Do().
		Object(result)
}

func (c *auth) Refresh(refreshToken string) (*api.AuthResponse, error) {
	body := &api.RefreshRequest{RefreshToken: refreshToken}
	result := &api.AuthResponse{}

	return result, c.client.Post().
		APIVersion("").
		Resource(fmt.Sprintf("%s/refresh", authResource)).
		Body(body).
		Do().
		Object(result)
}

func (c *auth) DeviceCode(authKind, slugID string) (*oauth2.DeviceAuthResponse, error) {
	result := &oauth2.DeviceAuthResponse{}

	return result, c.client.Post().
		APIVersion("").
		Resource(fmt.Sprintf("%s/providers/%s/%s/device/code", authResource, authKind, slugID)).
		Do().
		Object(result)
}

func (c *auth) DeviceAccessToken(authKind, slugID, deviceCode string) (*api.AuthResponse, error) {
	body := &api.TokenRequest{
		GrantType:  api.GrantTypeDeviceCode,
		DeviceCode: deviceCode,
	}
	result := &api.AuthResponse{}

	return result, c.client.Post().
		APIVersion("").
		Resource(fmt.Sprintf("%s/providers/%s/%s/token", authResource, authKind, slugID)).
		Body(body).
		Do().
		Object(result)
}

func (c *auth) ClientCredentialsToken(authKind, slugID, clientID, clientSecret string) (*api.AuthResponse, error) {
	body := &api.TokenRequest{
		GrantType:    api.GrantTypeClientCredentials,
		ClientID:     clientID,
		ClientSecret: clientSecret,
	}
	result := &api.AuthResponse{}

	return result, c.client.Post().
		APIVersion("").
		Resource(fmt.Sprintf("%s/providers/%s/%s/token", authResource, authKind, slugID)).
		Body(body).
		Do().
		Object(result)
}
