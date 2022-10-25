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
	"gopkg.in/yaml.v2"
)

func TestUnmarshalJSONBasicAuth(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		result BasicAuth
	}{
		{
			title: "classic basic auth",
			jason: `
{
  "username": "john",
  "password": "doe"
}
`,
			result: BasicAuth{
				Username: "john",
				Password: "doe",
			},
		},
		{
			title: "basic auth with password file",
			jason: `
{
  "username": "john",
  "password_file": "./test/password_file.txt"
}
`,
			result: BasicAuth{
				Username:     "john",
				PasswordFile: "./test/password_file.txt",
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := BasicAuth{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshalYAMLBasicAuth(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result BasicAuth
	}{
		{
			title: "classic basic auth",
			yamele: `
username: "john"
password: "doe"
`,
			result: BasicAuth{
				Username: "john",
				Password: "doe",
			},
		},
		{
			title: "basic auth with password file",
			yamele: `
username: "john"
password_file: "./test/password_file.txt"
`,
			result: BasicAuth{
				Username:     "john",
				PasswordFile: "./test/password_file.txt",
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := BasicAuth{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshalJSONAuth(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		result Auth
	}{
		{
			title: "Bearer Token",
			jason: `
{
  "bearer_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
}
`,
			result: Auth{
				BearerToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
			},
		},
		{
			title: "Basic Auth",
			jason: `
{
  "basic_auth": {
    "username": "john",
    "password": "doe"
  }
}
`,
			result: Auth{
				BasicAuth: &BasicAuth{
					Username: "john",
					Password: "doe",
				},
			},
		},
		{
			title: "ca cert",
			jason: `
{
  "ca_cert": "certificate"
}
`,
			result: Auth{
				CaCert: "certificate",
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Auth{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshalYAMLAuth(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result Auth
	}{
		{
			title: "Bearer Token",
			yamele: `
bearer_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
`,
			result: Auth{
				BearerToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
			},
		},
		{
			title: "Basic Auth",
			yamele: `
basic_auth:
  username: "john"
  password: "doe"
`,
			result: Auth{
				BasicAuth: &BasicAuth{
					Username: "john",
					Password: "doe",
				},
			},
		},
		{
			title: "ca cert",
			yamele: `
ca_cert: "certificate"
`,
			result: Auth{
				CaCert: "certificate",
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Auth{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

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
				URL: &url.URL{
					Scheme: "http",
					Host:   "localhost:9090",
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
				URL: &url.URL{
					Scheme: "http",
					Host:   "localhost:9090",
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
  "endpoint_pattern": "/api/v1/labels",
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
  "endpoint_pattern": "^/?api/v./[a-zA-Z0-9]$",
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
endpoint_pattern: "/api/v1/labels"
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
endpoint_pattern: "^/?api/v./[a-zA-Z0-9]$"
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
  "endpoint_pattern": "/api/v1/labels",
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
  "endpoint_pattern": "^/?api/v./[a-zA-Z0-9]$",
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
			result: `endpoint_pattern: /api/v1/labels
method: POST
`,
		},
		{
			title: "complex endpoint patter",
			allowedEndpoint: AllowedEndpoint{
				EndpointPattern: common.MustNewRegexp("^/?api/v./[a-zA-Z0-9]$"),
				Method:          http.MethodPost,
			},
			result: `endpoint_pattern: ^/?api/v./[a-zA-Z0-9]$
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

func TestValidateAndExtract(t *testing.T) {
	// Check and Validate HTTPProxy contained in a proper struct
	type aStruct struct {
		A struct {
			B struct {
				Kind string
				Spec *Config
			}
		}
	}

	u, _ := url.Parse("http://localhost:8080")

	b := &aStruct{
		A: struct {
			B struct {
				Kind string
				Spec *Config
			}
		}{B: struct {
			Kind string
			Spec *Config
		}{Kind: "HTTPProxy", Spec: &Config{URL: u}}},
	}

	c, err := ValidateAndExtract(b)
	assert.NoError(t, err)
	assert.Equal(t, &Config{URL: u}, c)

	// Check and Validate HTTPProxy when it is hidden in a map of interface
	uglyStruct := map[string]interface{}{
		"direct_url": "",
		"proxy": map[string]interface{}{
			"kind": "HTTPProxy",
			"spec": map[string]interface{}{
				"url": "http://localhost:8080",
			},
		},
	}
	c, err = ValidateAndExtract(uglyStruct)
	assert.NoError(t, err)
	assert.Equal(t, &Config{URL: u}, c)
}
