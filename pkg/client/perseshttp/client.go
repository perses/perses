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

package perseshttp

import (
	"net"
	"net/http"
	"net/url"
	"time"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/secret"
)

const connectionTimeout = 30 * time.Second

// PublicRestConfigClient is the struct that should be used when printing the config
type PublicRestConfigClient struct {
	URL       *common.URL             `json:"url" yaml:"url"`
	BasicAuth *secret.PublicBasicAuth `json:"basicAuth,omitempty" yaml:"basicAuth,omitempty"`
	// The HTTP authorization credentials for the targets.
	Authorization *secret.PublicAuthorization `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	// TLSConfig to use to connect to the targets.
	TLSConfig *secret.PublicTLSConfig `json:"tlsConfig,omitempty" yaml:"tlsConfig,omitempty"`
	Headers   map[string]string       `json:"headers,omitempty" yaml:"headers,omitempty"`
}

func NewPublicRestConfigClient(config *RestConfigClient) *PublicRestConfigClient {
	if config == nil {
		return nil
	}
	return &PublicRestConfigClient{
		URL:           config.URL,
		BasicAuth:     secret.NewPublicBasicAuth(config.BasicAuth),
		Authorization: secret.NewPublicAuthorization(config.Authorization),
		TLSConfig:     secret.NewPublicTLSConfig(config.TLSConfig),
		Headers:       config.Headers,
	}
}

// RestConfigClient defines all parameters that can be set to customize the RESTClient
type RestConfigClient struct {
	URL       *common.URL       `json:"url" yaml:"url"`
	BasicAuth *secret.BasicAuth `json:"basicAuth,omitempty" yaml:"basicAuth,omitempty"`
	// The HTTP authorization credentials for the targets.
	Authorization *secret.Authorization `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	// TLSConfig to use to connect to the targets.
	TLSConfig *secret.TLSConfig `json:"tlsConfig,omitempty" yaml:"tlsConfig,omitempty"`
	Headers   map[string]string `json:"headers,omitempty" yaml:"headers,omitempty"`
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

// NewFromConfig create an instance of RESTClient using the config passed as parameter
func NewFromConfig(config RestConfigClient) (*RESTClient, error) {
	roundTripper, err := NewRoundTripper(connectionTimeout, config.TLSConfig)
	if err != nil {
		return nil, err
	}

	httpClient := &http.Client{
		Transport: roundTripper,
		Timeout:   connectionTimeout,
	}

	return &RESTClient{
		authorization: config.Authorization,
		BaseURL:       config.URL.URL,
		Client:        httpClient,
		headers:       config.Headers,
		basicAuth:     config.BasicAuth,
	}, nil
}

// RESTClient defines an HTTP client designed for the HTTP request to a REST API.
type RESTClient struct {
	// Usually it contains the bearer token required to contact the remote API.
	authorization *secret.Authorization
	// basicAuth to be used for each request (not editable)
	// Using a basicAuth has the priority other the token
	basicAuth *secret.BasicAuth
	// Default headers for all client requests (not editable)
	headers map[string]string
	// base is the root URL for all invocations of the client
	BaseURL *url.URL
	// Set specific behavior of the client.  If not set http.DefaultClient will be used.
	Client *http.Client
}

// GetHeaders gets the headers
func (c *RESTClient) GetHeaders() map[string]string {
	return c.headers
}

// Get begins a GET request. Short for c.newRequest("GET")
func (c *RESTClient) Get() *Request {
	return c.newRequest(http.MethodGet)
}

// Post begins a Post request. Short for c.newRequest("POST")
func (c *RESTClient) Post() *Request {
	return c.newRequest(http.MethodPost)
}

// Put begins a Put request. Short for c.newRequest("PUT")
func (c *RESTClient) Put() *Request {
	return c.newRequest(http.MethodPut)
}

// Patch begins a Patch request. Short for c.newRequest("PATCH")
func (c *RESTClient) Patch() *Request {
	return c.newRequest(http.MethodPatch)
}

// Delete begins a Delete request. Short for c.newRequest("DELETE")
func (c *RESTClient) Delete() *Request {
	return c.newRequest(http.MethodDelete)
}

func (c *RESTClient) newRequest(method string) *Request {
	return NewRequest(c.Client, method, c.BaseURL, c.authorization, c.basicAuth, c.headers)
}
