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

package http

import (
	"encoding/json"
	"net/http"
	"net/url"
	"testing"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

func TestUnmarshalJSONConfig(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		result Config
	}{
		{
			title: "basic config",
			jason: `
{
  "url": "http://localhost:9090"
}
`,
			result: Config{
				URL: &common.URL{
					URL: &url.URL{
						Scheme: "http",
						Host:   "localhost:9090",
					},
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Config{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshalYAMLConfig(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result Config
	}{
		{
			title: "basic config",
			yamele: `
url: "http://localhost:9090"
`,
			result: Config{
				URL: &common.URL{
					URL: &url.URL{
						Scheme: "http",
						Host:   "localhost:9090",
					},
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Config{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshalJSONAllowedEndpoint(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		result AllowedEndpoint
	}{
		{
			title: "simple endpoint",
			jason: `
{
  "endpointPattern": "/api/v1/labels",
  "method": "POST"
}
`,
			result: AllowedEndpoint{
				EndpointPattern: common.MustNewRegexp("/api/v1/labels"),
				Method:          http.MethodPost,
			},
		},
		{
			title: "complex endpoint patter",
			jason: `
{
  "endpointPattern": "^/?api/v./[a-zA-Z0-9]$",
  "method": "POST"
}
`,
			result: AllowedEndpoint{
				EndpointPattern: common.MustNewRegexp("^/?api/v./[a-zA-Z0-9]$"),
				Method:          http.MethodPost,
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := AllowedEndpoint{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshalYAMLAllowedEndpoint(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result AllowedEndpoint
	}{
		{
			title: "simple endpoint",
			yamele: `
endpointPattern: "/api/v1/labels"
method: "POST"
`,
			result: AllowedEndpoint{
				EndpointPattern: common.MustNewRegexp("/api/v1/labels"),
				Method:          http.MethodPost,
			},
		},
		{
			title: "complex endpoint patter",
			yamele: `
endpointPattern: "^/?api/v./[a-zA-Z0-9]$"
method: "POST"
`,
			result: AllowedEndpoint{
				EndpointPattern: common.MustNewRegexp("^/?api/v./[a-zA-Z0-9]$"),
				Method:          http.MethodPost,
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := AllowedEndpoint{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestMarshalJSONAllowedEndpoint(t *testing.T) {
	testSuite := []struct {
		title           string
		allowedEndpoint AllowedEndpoint
		result          string
	}{
		{
			title: "simple endpoint",
			allowedEndpoint: AllowedEndpoint{
				EndpointPattern: common.MustNewRegexp("/api/v1/labels"),
				Method:          http.MethodPost,
			},
			result: `{
  "endpointPattern": "/api/v1/labels",
  "method": "POST"
}`,
		},
		{
			title: "complex endpoint patter",
			allowedEndpoint: AllowedEndpoint{
				EndpointPattern: common.MustNewRegexp("^/?api/v./[a-zA-Z0-9]$"),
				Method:          http.MethodPost,
			},
			result: `{
  "endpointPattern": "^/?api/v./[a-zA-Z0-9]$",
  "method": "POST"
}`,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			data, err := json.MarshalIndent(test.allowedEndpoint, "", "  ")
			assert.NoError(t, err)
			assert.Equal(t, test.result, string(data))
		})
	}
}

func TestMarshalYAMLAllowedEndpoint(t *testing.T) {
	testSuite := []struct {
		title           string
		allowedEndpoint AllowedEndpoint
		result          string
	}{
		{
			title: "simple endpoint",
			allowedEndpoint: AllowedEndpoint{
				EndpointPattern: common.MustNewRegexp("/api/v1/labels"),
				Method:          http.MethodPost,
			},
			result: `endpointPattern: /api/v1/labels
method: POST
`,
		},
		{
			title: "complex endpoint patter",
			allowedEndpoint: AllowedEndpoint{
				EndpointPattern: common.MustNewRegexp("^/?api/v./[a-zA-Z0-9]$"),
				Method:          http.MethodPost,
			},
			result: `endpointPattern: ^/?api/v./[a-zA-Z0-9]$
method: POST
`,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			data, err := yaml.Marshal(test.allowedEndpoint)
			assert.NoError(t, err)
			assert.Equal(t, test.result, string(data))
		})
	}
}
