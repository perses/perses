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
	"net/http"

	"github.com/perses/perses/pkg/model/api/v1/common"
)

// RESTClient defines an HTTP client designed for the HTTP request to a REST API.
type RESTClient struct {
	// Default headers for all client requests (not editable)
	Headers map[string]string
	// base is the root URL for all invocations of the client
	BaseURL *common.URL
	// Set specific behavior of the client. If not, set http.DefaultClient will be used.
	Client *http.Client
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
	return NewRequest(c.Client, method, c.BaseURL, c.Headers)
}
