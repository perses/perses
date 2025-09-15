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

// PublicRestConfigClient is the struct that should be used when printing the config
type PublicRestConfigClient struct {
	URL        *common.URL             `json:"url" yaml:"url"`
	NativeAuth *api.PublicAuth         `json:"native_auth,omitempty" yaml:"native_auth,omitempty"`
	Oauth      *secret.PublicOAuth     `json:"oauth_config,omitempty" yaml:"oauth_config,omitempty"`
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
		Oauth:         secret.NewPublicOAuth(config.OAuth),
		Authorization: secret.NewPublicAuthorization(config.Authorization),
		TLSConfig:     secret.NewPublicTLSConfig(config.TLSConfig),
		Headers:       config.Headers,
	}
}

// RestConfigClient defines all parameters that can be set to customize the RESTClient
type RestConfigClient struct {
	URL        *common.URL       `json:"url" yaml:"url"`
	NativeAuth *api.Auth         `json:"native_auth,omitempty" yaml:"native_auth,omitempty"`
	OAuth      *secret.OAuth     `json:"oauth,omitempty" yaml:"oauth,omitempty"`
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
	if c.OAuth != nil {
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
			AccessToken: base64.StdEncoding.EncodeToString(fmt.Appendf(nil, "%s:%s", config.BasicAuth.Username, password)),
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
		roundTripper = transport.New(config.URL, roundTripper, *config.NativeAuth)
	}
	if config.OAuth != nil {
		clientSecret, clientSecretErr := config.OAuth.GetClientSecret()
		if clientSecretErr != nil {
			return nil, clientSecretErr
		}
		oauthConfig := &clientcredentials.Config{
			ClientID:     config.OAuth.ClientID,
			ClientSecret: clientSecret,
			TokenURL:     config.OAuth.TokenURL,
			Scopes:       config.OAuth.Scopes,
			AuthStyle:    oauth2.AuthStyle(config.OAuth.AuthStyle),
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
		BaseURL: config.URL,
		Client:  httpClient,
		Headers: config.Headers,
	}, nil
}
