// Copyright 2021 Amadeus s.a.s
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
	"crypto/tls"
	"errors"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"net/url"
	"sync"
	"time"
)

const connectionTimeout = 30 * time.Second

type BasicAuth struct {
	User     string `yaml:"user"`
	Password string `yaml:"password,omitempty"`
	// PasswordFile is a path to a file that contains a password
	PasswordFile string `yaml:"password_file,omitempty"`
}

func (b *BasicAuth) Verify() error {
	if len(b.User) == 0 || (len(b.Password) == 0 && len(b.PasswordFile) == 0) {
		return fmt.Errorf("when using basic_auth, user or password cannot be empty")
	}
	if len(b.PasswordFile) > 0 {
		// Read the file and load the password contained
		data, err := ioutil.ReadFile(b.PasswordFile)
		if err != nil {
			return err
		}
		b.Password = string(data)
	}
	return nil
}

// RestConfigClient defines all parameter that can be set to customize the RESTClient
type RestConfigClient struct {
	URL         string            `yaml:"url"`
	InsecureTLS bool              `yaml:"insecure_tls,omitempty"`
	Token       string            `yaml:"token,omitempty"`
	BasicAuth   *BasicAuth        `yaml:"basic_auth,omitempty"`
	Headers     map[string]string `yaml:"headers,omitempty"`
}

// NewFromConfig create an instance of RESTClient using the config passed as parameter
func NewFromConfig(config *RestConfigClient) (*RESTClient, error) {
	if config == nil {
		return nil, errors.New("configuration cannot be empty")
	}
	roundTripper := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   connectionTimeout,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout: 10 * time.Second,
		TLSClientConfig:     &tls.Config{InsecureSkipVerify: config.InsecureTLS}, // nolint: gas, gosec
	}

	httpClient := &http.Client{
		Transport: roundTripper,
		Timeout:   connectionTimeout,
	}

	u, err := url.Parse(config.URL)
	if err != nil {
		return nil, err
	}

	return &RESTClient{
		token:     config.Token,
		BaseURL:   u,
		Client:    httpClient,
		headers:   config.Headers,
		basicAuth: config.BasicAuth,
	}, nil

}

// RESTClient defines an HTTP client designed for the HTTP request to a REST API.
type RESTClient struct {
	tokenMutex sync.Mutex
	// Default token used to be authenticated in all client requests.
	// It can be override using the method SetToken
	token string
	// basicAuth to be used for each request (not editable)
	// Using a basicAuth has the priority other the token
	basicAuth *BasicAuth
	// Default headers for all client requests (not editable)
	headers map[string]string
	// base is the root URL for all invocations of the client
	BaseURL *url.URL
	// Set specific behavior of the client.  If not set http.DefaultClient will be used.
	Client *http.Client
}

// GetToken gets the token
func (c *RESTClient) GetToken() string {
	c.tokenMutex.Lock()
	defer c.tokenMutex.Unlock()
	return c.token
}

// SetToken set the token (thread safe)
func (c *RESTClient) SetToken(token string) {
	c.tokenMutex.Lock()
	defer c.tokenMutex.Unlock()
	c.token = token
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
	return NewRequest(c.Client, method, c.BaseURL, c.GetToken(), c.basicAuth, c.headers)
}
