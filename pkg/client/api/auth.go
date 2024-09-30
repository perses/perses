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
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/client/perseshttp"
	"github.com/perses/perses/pkg/model/api"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"
)

const authResource = "auth"

// AuthInterface has methods to work with Auth resource
type AuthInterface interface {
	Login(user, password string) (*api.AuthResponse, error)
	Refresh(refreshToken string) (*api.AuthResponse, error)
	DeviceCode(authKind, authProvider string) (*oauth2.DeviceAuthResponse, error)
	DeviceAccessToken(authKind, slugID string, deviceCAuthResp *oauth2.DeviceAuthResponse) (*api.AuthResponse, error)
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
	config := oauth2.Config{
		Endpoint: oauth2.Endpoint{
			DeviceAuthURL: c.deviceAuthURL(authKind, slugID),
		},
	}

	resp, err := config.DeviceAuth(context.Background())

	// Strangely enough, the oauth2.DeviceAuth function does not parse the error body, so we have to it ourselves
	oauthErr := &oauth2.RetrieveError{}
	if err != nil && errors.As(err, &oauthErr) {
		unmErr := json.Unmarshal(oauthErr.Body, &oauthErr)
		if unmErr != nil {
			return nil, &perseshttp.RequestError{Err: unmErr}
		}
		return nil, &perseshttp.RequestError{Err: oauthErr}
	}

	return resp, nil
}

func (c *auth) DeviceAccessToken(authKind, slugID string, deviceAuthResp *oauth2.DeviceAuthResponse) (*api.AuthResponse, error) {
	config := &oauth2.Config{
		Endpoint: oauth2.Endpoint{
			TokenURL: c.tokenURL(authKind, slugID),
		},
	}
	token, err := config.DeviceAccessToken(context.Background(), deviceAuthResp)
	if err != nil {
		return nil, &perseshttp.RequestError{Err: err}
	}
	return &api.AuthResponse{
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
	}, nil
}

func (c *auth) ClientCredentialsToken(authKind, slugID, clientID, clientSecret string) (*api.AuthResponse, error) {
	config := &clientcredentials.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		TokenURL:     c.tokenURL(authKind, slugID),
		AuthStyle:    oauth2.AuthStyleInHeader,
	}
	token, err := config.Token(context.Background())
	if err != nil {
		return nil, &perseshttp.RequestError{Err: err}
	}
	return &api.AuthResponse{
		AccessToken: token.AccessToken,
	}, nil
}

func (c *auth) deviceAuthURL(authKind, authProvider string) string {
	return fmt.Sprintf("%s%s/%s/%s/%s/%s", c.client.BaseURL.String(), utils.APIPrefix, utils.PathAuthProviders, authKind, authProvider, utils.PathDeviceCode)
}

func (c *auth) tokenURL(authKind, authProvider string) string {
	return fmt.Sprintf("%s%s/%s/%s/%s/%s", c.client.BaseURL.String(), utils.APIPrefix, utils.PathAuthProviders, authKind, authProvider, utils.PathToken)
}
