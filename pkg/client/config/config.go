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
	"encoding/base64"
	"fmt"
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

type PublicOauth struct {
	ClientID       secret.Hidden    `json:"client_id" yaml:"client_id"`
	ClientSecret   secret.Hidden    `json:"client_secret" yaml:"client_secret"`
	TokenURL       string           `json:"token_url" yaml:"token_url"`
	Scopes         []string         `json:"scopes" yaml:"scopes"`
	EndpointParams url.Values       `json:"endpoint_params" yaml:"endpoint_params"`
	AuthStyle      oauth2.AuthStyle `json:"auth_style" yaml:"auth_style"`
}

func newPublicOauth(oauthConfig *Oauth) *PublicOauth {
	if oauthConfig == nil {
		return nil
	}
	return &PublicOauth{
		ClientID:       secret.Hidden(oauthConfig.ClientID),
		ClientSecret:   secret.Hidden(oauthConfig.ClientSecret),
		TokenURL:       oauthConfig.TokenURL,
		Scopes:         oauthConfig.Scopes,
		EndpointParams: oauthConfig.EndpointParams,
		AuthStyle:      oauthConfig.AuthStyle,
	}
}

// PublicRestConfigClient is the struct that should be used when printing the config
type PublicRestConfigClient struct {
	URL        *common.URL             `json:"url" yaml:"url"`
	NativeAuth *api.PublicAuth         `json:"native_auth,omitempty" yaml:"native_auth,omitempty"`
	Oauth      *PublicOauth            `json:"oauth_config,omitempty" yaml:"oauth_config,omitempty"`
	BasicAuth  *secret.PublicBasicAuth `json:"basic_auth,omitempty" yaml:"basic_auth,omitempty"`
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
		NativeAuth:    api.NewPublicAuth(config.NativeAuth),
		BasicAuth:     secret.NewPublicBasicAuth(config.BasicAuth),
		Oauth:         newPublicOauth(config.Oauth),
		Authorization: secret.NewPublicAuthorization(config.Authorization),
		TLSConfig:     secret.NewPublicTLSConfig(config.TLSConfig),
		Headers:       config.Headers,
	}
}

type Oauth struct {
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

// RestConfigClient defines all parameters that can be set to customize the RESTClient
type RestConfigClient struct {
	URL        *common.URL       `json:"url" yaml:"url"`
	NativeAuth *api.Auth         `json:"native_auth,omitempty" yaml:"native_auth,omitempty"`
	Oauth      *Oauth            `json:"oauth,omitempty" yaml:"oauth,omitempty"`
	BasicAuth  *secret.BasicAuth `json:"basic_auth,omitempty" yaml:"basic_auth,omitempty"`
	// The HTTP authorization credentials for the targets.
	Authorization *secret.Authorization `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	// TLSConfig to use to connect to the targets.
	TLSConfig *secret.TLSConfig `json:"tls_config,omitempty" yaml:"tls_config,omitempty"`
	Headers   map[string]string `json:"headers,omitempty" yaml:"headers,omitempty"`
}

func (c *RestConfigClient) Validate() error {
	if c == nil {
		return nil
	}
	nbAuthConfigured := 0
	if c.NativeAuth != nil {
		nbAuthConfigured++
	}
	if c.Oauth != nil {
		nbAuthConfigured++
	}
	if c.BasicAuth != nil {
		nbAuthConfigured++
	}
	if c.Authorization != nil {
		nbAuthConfigured++
	}
	if nbAuthConfigured > 1 {
		return fmt.Errorf("only one type of authentication should be configured")
	}
	return nil
}

func NewRoundTripper(timeout time.Duration, tlsConfig *secret.TLSConfig) (http.RoundTripper, error) {
	tlsCfg, err := secret.BuildTLSConfig(tlsConfig)
	if err != nil {
		return nil, err
	}
	return &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   timeout,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout: 10 * time.Second,
		TLSClientConfig:     tlsCfg, // nolint: gas, gosec
	}, nil
}

// NewRESTClient create an instance of RESTClient using the config passed as parameter
func NewRESTClient(config RestConfigClient) (*perseshttp.RESTClient, error) {
	roundTripper, err := NewRoundTripper(connectionTimeout, config.TLSConfig)
	if err != nil {
		return nil, err
	}
	var httpClient *http.Client

	ctx := context.WithValue(context.Background(), oauth2.HTTPClient, &http.Client{
		Transport: roundTripper,
		Timeout:   connectionTimeout,
	})
	if config.BasicAuth != nil {
		c := oauth2.Config{}
		password, getPasswordErr := config.BasicAuth.GetPassword()
		if getPasswordErr != nil {
			return nil, getPasswordErr
		}
		httpClient = c.Client(ctx, &oauth2.Token{
			AccessToken: base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:%s", config.BasicAuth.Username, password))),
			TokenType:   "basic",
		})
	}
	if config.Authorization != nil {
		c := oauth2.Config{}
		credential, getCredentialErr := config.Authorization.GetCredentials()
		if getCredentialErr != nil {
			return nil, getCredentialErr
		}
		httpClient = c.Client(ctx, &oauth2.Token{
			AccessToken: credential,
			TokenType:   config.Authorization.Type,
		})
	}
	if config.NativeAuth != nil {
		roundTripper = transport.New(config.URL.URL, roundTripper, *config.NativeAuth)
	}
	if config.Oauth != nil {
		oauthConfig := &clientcredentials.Config{
			ClientID:     config.Oauth.ClientID,
			ClientSecret: config.Oauth.ClientSecret,
			TokenURL:     config.Oauth.TokenURL,
			Scopes:       config.Oauth.Scopes,
			AuthStyle:    config.Oauth.AuthStyle,
		}

		httpClient = oauthConfig.Client(ctx)
	}

	if httpClient == nil {
		httpClient = &http.Client{
			Transport: roundTripper,
			Timeout:   connectionTimeout,
		}
	}

	return &perseshttp.RESTClient{
		BaseURL: config.URL.URL,
		Client:  httpClient,
		Headers: config.Headers,
	}, nil
}
