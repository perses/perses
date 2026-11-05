// Copyright The Perses Authors
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
	"testing"

	"github.com/perses/common/config"
	"github.com/stretchr/testify/assert"
)

// TestSecurity_VerifyK8s checks that the k8s authz can't be enabled alongside native authz
func TestSecurity_VerifyK8s(t *testing.T) {
	testSuite := []struct {
		title      string
		yaml       string
		errMessage string
	}{
		{
			title: "auth cannot be disabled when a authz provider is enabled",
			yaml: `
readonly: false
encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
enable_auth: false
authentication:
  disable_sign_up: true
  providers:
    enable_native: true
authorization:
  provider:
    kubernetes:
      enable: true
cors:
  enable: true
  allow_origins:
    - https://github.com
  allow_methods:
    - GET
    - POST
  allow_headers:
    - X-Custom-Header
  allow_credentials: true
  expose_headers:
    - Content-Encoding
  max_age: 60
`,
			errMessage: "authorization provider cannot be setup without auth enabled",
		},
		{
			title: "valid k8s auth configuration",
			yaml: `
readonly: false
encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
enable_auth: true
authentication:
  disable_sign_up: true
  providers:
    kubernetes:
      enable: true
authorization:
  provider:
    kubernetes:
      enable: true
cors:
  enable: true
  allow_origins:
    - https://github.com
  allow_methods:
    - GET
    - POST
  allow_headers:
    - X-Custom-Header
  allow_credentials: true
  expose_headers:
    - Content-Encoding
  max_age: 60
`,
			errMessage: "",
		},
		{
			title: "cannot enable auth without authentication provider",
			yaml: `
readonly: false
encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
enable_auth: true
authentication:
  disable_sign_up: true
authorization:
  provider:
    kubernetes:
      enable: true
cors:
  enable: true
  allow_origins:
    - https://github.com
  allow_methods:
    - GET
    - POST
  allow_headers:
    - X-Custom-Header
  allow_credentials: true
  expose_headers:
    - Content-Encoding
  max_age: 60
`,
			errMessage: "impossible to enable auth if no authentication provider is setup",
		},
		{
			title: "cannot enable k8s authentication with no authorization set",
			yaml: `
readonly: false
encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
enable_auth: true
authentication:
  disable_sign_up: true
  providers:
    kubernetes:
      enable: true
cors:
  enable: true
  allow_origins:
    - https://github.com
  allow_methods:
    - GET
    - POST
  allow_headers:
    - X-Custom-Header
  allow_credentials: true
  expose_headers:
    - Content-Encoding
  max_age: 60
`,
			errMessage: "kubernetes authorization and authentication providers must be enabled at the same time",
		},
		{
			title: "cannot enable k8s authorization with non-k8s authentication set",
			yaml: `
readonly: false
encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
enable_auth: true
authentication:
  providers:
    enable_native: true
authorization:
  provider:
    kubernetes:
      enable: true
cors:
  enable: true
  allow_origins:
    - https://github.com
  allow_methods:
    - GET
    - POST
  allow_headers:
    - X-Custom-Header
  allow_credentials: true
  expose_headers:
    - Content-Encoding
  max_age: 60
`,
			errMessage: "kubernetes authorization and authentication providers must be enabled at the same time",
		},
		{
			title: "cannot enable k8s authentication with native authorization",
			yaml: `
readonly: false
encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
enable_auth: true
authentication:
  disable_sign_up: true
  providers:
    kubernetes:
      enable: true
authorization:
  provider:
    native:
      enable: true
cors:
  enable: true
  allow_origins:
    - https://github.com
  allow_methods:
    - GET
    - POST
  allow_headers:
    - X-Custom-Header
  allow_credentials: true
  expose_headers:
    - Content-Encoding
  max_age: 60
`,
			errMessage: "kubernetes authorization and authentication providers must be enabled at the same time",
		},
		{
			title: "valid native authz configuration (ensure backwards compatibility)",
			yaml: `
readonly: false
encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
enable_auth: true
authentication:
  disable_sign_up: true
  providers:
    enable_native: true
authorization:
  provider:
    native:
      guest_permissions:
        - actions:
            - read
          scopes:
            - "*"
        - actions:
            - create
          scopes:
            - Project
cors:
  enable: true
  allow_origins:
    - https://github.com
  allow_methods:
    - GET
    - POST
  allow_headers:
    - X-Custom-Header
  allow_credentials: true
  expose_headers:
    - Content-Encoding
  max_age: 60
`,
			errMessage: "",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			err := config.NewResolver[Security]().
				SetConfigData([]byte(test.yaml)).
				Resolve(&Security{}).
				Verify()
			if len(test.errMessage) == 0 {
				assert.NoError(t, err)
			} else {
				assert.ErrorContains(t, err, test.errMessage)
			}
		})
	}
}
