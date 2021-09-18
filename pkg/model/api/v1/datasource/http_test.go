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

package datasource

import (
	"encoding/json"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

func TestUnmarshallJSONBasicAuth(t *testing.T) {
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

func TestUnmarshallYAMLBasicAuth(t *testing.T) {
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

func TestUnmarshallJSONHTTPAuth(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		result HTTPAuth
	}{
		{
			title: "Bearer Token",
			jason: `
{
  "bearer_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
}
`,
			result: HTTPAuth{
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
			result: HTTPAuth{
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
			result: HTTPAuth{
				CaCert: "certificate",
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := HTTPAuth{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshallYAMLHTTPAuth(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result HTTPAuth
	}{
		{
			title: "Bearer Token",
			yamele: `
bearer_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
`,
			result: HTTPAuth{
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
			result: HTTPAuth{
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
			result: HTTPAuth{
				CaCert: "certificate",
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := HTTPAuth{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshallJSONHTTPConfig(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		result HTTPConfig
	}{
		{
			title: "basic config",
			jason: `
{
  "url": "http://localhost:9090"
}
`,
			result: HTTPConfig{
				URL: &url.URL{
					Scheme: "http",
					Host:   "localhost:9090",
				},
				Access: ServerHTTPAccess,
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := HTTPConfig{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshallYAMLHTTPConfig(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result HTTPConfig
	}{
		{
			title: "basic config",
			yamele: `
url: "http://localhost:9090"
`,
			result: HTTPConfig{
				URL: &url.URL{
					Scheme: "http",
					Host:   "localhost:9090",
				},
				Access: ServerHTTPAccess,
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := HTTPConfig{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), &result))
			assert.Equal(t, test.result, result)
		})
	}
}
