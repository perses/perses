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

package config

import (
	"context"
	"net"
	"net/http"
	"net/url"
	"time"

	"github.com/perses/perses/pkg/client/perseshttp"
	"github.com/perses/perses/pkg/client/transport"
	"github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"
)

const connectionTimeout = 30 * time.Second

type PublicOauthConfig struct {
	ClientID       secret.Hidden    `json:"client_id" yaml:"client_id"`
	ClientSecret   secret.Hidden    `json:"client_secret" yaml:"client_secret"`
	TokenURL       string           `json:"token_url" yaml:"token_url"`
	Scopes         []string         `json:"scopes" yaml:"scopes"`
	EndpointParams url.Values       `json:"endpoint_params" yaml:"endpoint_params"`
	AuthStyle      oauth2.AuthStyle `json:"auth_style" yaml:"auth_style"`
}

func newPublicOauthConfig(oauthConfig *OauthConfig) *PublicOauthConfig {
	if oauthConfig == nil {
		return nil
	}
	return &PublicOauthConfig{
		ClientID:       secret.Hidden(oauthConfig.ClientID),
		ClientSecret:   secret.Hidden(oauthConfig.ClientSecret),
		TokenURL:       oauthConfig.TokenURL,
		Scopes:         oauthConfig.Scopes,
		EndpointParams: oauthConfig.EndpointParams,
		AuthStyle:      oauthConfig.AuthStyle,
	}
}

type PublicAuthConfig struct {
	NativeAuth  *api.PublicAuth         `json:"native_auth,omitempty" yaml:"native_auth,omitempty"`
	OauthConfig *PublicOauthConfig      `json:"oauth_config,omitempty" yaml:"oauth_config,omitempty"`
	BasicAuth   *secret.PublicBasicAuth `json:"basic_auth,omitempty" yaml:"basic_auth,omitempty"`
}

func newPublicAuthConfig(auth *AuthConfig) *PublicAuthConfig {
	if auth == nil {
		return nil
	}
	return &PublicAuthConfig{
		OauthConfig: newPublicOauthConfig(auth.OauthConfig),
		BasicAuth:   secret.NewPublicBasicAuth(auth.BasicAuth),
		NativeAuth:  api.NewPublicAuth(auth.NativeAuth),
	}
}

// PublicRestConfigClient is the struct that should be used when printing the config
type PublicRestConfigClient struct {
	URL  *common.URL       `json:"url" yaml:"url"`
	Auth *PublicAuthConfig `json:"auth,omitempty" yaml:"auth,omitempty"`
	// The HTTP authorization credentials for the targets.
	Authorization *secret.PublicAuthorization `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	// TLSConfig to use to connect to the targets.
	TLSConfig *secret.PublicTLSConfig `json:"tls_config,omitempty" yaml:"tls_config,omitempty"`
	Headers   map[string]string       `json:"headers,omitempty" yaml:"headers,omitempty"`
}

func NewPublicRestConfigClient(config *RestConfigClient) *PublicRestConfigClient {
	if config == nil {
		return nil
	}
	return &PublicRestConfigClient{
		URL:           config.URL,
		Auth:          newPublicAuthConfig(config.Auth),
		Authorization: secret.NewPublicAuthorization(config.Authorization),
		TLSConfig:     secret.NewPublicTLSConfig(config.TLSConfig),
		Headers:       config.Headers,
	}
}

type OauthConfig struct {
	// ClientID is the application's ID.
	ClientID string `json:"client_id" yaml:"client_id"`
	// ClientSecret is the application's secret.
	ClientSecret string `json:"client_secret" yaml:"client_secret"`
	// TokenURL is the resource server's token endpoint
	// URL. This is a constant specific to each server.
	TokenURL string `json:"token_url" yaml:"token_url"`
	// Scope specifies optional requested permissions.
	Scopes []string `json:"scopes" yaml:"scopes"`
	// EndpointParams specifies additional parameters for requests to the token endpoint.
	EndpointParams url.Values `json:"endpoint_params" yaml:"endpoint_params"`
	// AuthStyle optionally specifies how the endpoint wants the
	// client ID & client secret sent. The zero value means to
	// auto-detect.
	AuthStyle oauth2.AuthStyle `json:"auth_style" yaml:"auth_style"`
}

type AuthConfig struct {
	NativeAuth  *api.Auth         `json:"native_auth,omitempty" yaml:"native_auth,omitempty"`
	OauthConfig *OauthConfig      `json:"oauth_config,omitempty" yaml:"oauth_config,omitempty"`
	BasicAuth   *secret.BasicAuth `json:"basic_auth,omitempty" yaml:"basic_auth,omitempty"`
}

// RestConfigClient defines all parameters that can be set to customize the RESTClient
type RestConfigClient struct {
	URL  *common.URL `json:"url" yaml:"url"`
	Auth *AuthConfig `json:"auth,omitempty" yaml:"auth,omitempty"`
	// The HTTP authorization credentials for the targets.
	Authorization *secret.Authorization `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	// TLSConfig to use to connect to the targets.
	TLSConfig *secret.TLSConfig `json:"tls_config,omitempty" yaml:"tls_config,omitempty"`
	Headers   map[string]string `json:"headers,omitempty" yaml:"headers,omitempty"`
}

// NewFromConfig create an instance of RESTClient using the config passed as parameter
func NewFromConfig(config RestConfigClient) (*perseshttp.RESTClient, error) {
	if config.Auth != nil && config.Auth.OauthConfig != nil {
		// In case oauth is configured, then TLS parameters are ignored.
		// Everything is handled by the custom http client from Oauth2 (including the refresh of the token).
		oauthConfig := &clientcredentials.Config{
			ClientID:     config.Auth.OauthConfig.ClientID,
			ClientSecret: config.Auth.OauthConfig.ClientSecret,
			TokenURL:     config.Auth.OauthConfig.TokenURL,
			Scopes:       config.Auth.OauthConfig.Scopes,
			AuthStyle:    config.Auth.OauthConfig.AuthStyle,
		}
		httpClient := oauthConfig.Client(context.Background())
		return &perseshttp.RESTClient{
			Headers: config.Headers,
			BaseURL: config.URL.URL,
			Client:  httpClient,
		}, nil
	}

	tlsCfg, err := secret.BuildTLSConfig(config.TLSConfig)
	if err != nil {
		return nil, err
	}
	var roundTripper http.RoundTripper = &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   connectionTimeout,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout: 10 * time.Second,
		TLSClientConfig:     tlsCfg, // nolint: gas, gosec
	}
	var basicAuth *secret.BasicAuth

	if config.Auth != nil {
		if config.Auth.BasicAuth != nil {
			basicAuth = config.Auth.BasicAuth
		}
		if config.Auth.NativeAuth != nil {
			roundTripper = transport.New(config.URL.URL, roundTripper, *config.Auth.NativeAuth)
		}
	}

	httpClient := &http.Client{
		Transport: roundTripper,
		Timeout:   connectionTimeout,
	}

	return &perseshttp.RESTClient{
		BaseURL:       config.URL.URL,
		Authorization: config.Authorization,
		BasicAuth:     basicAuth,
		Client:        httpClient,
		Headers:       config.Headers,
	}, nil
}
