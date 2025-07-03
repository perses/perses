// Copyright 2023 The Perses Authors
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
	testYamlInput := `
readonly: false
encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
enable_auth: true
authentication:
  disable_sign_up: true
  providers:
    enable_native: true
authorization:
  guest_permissions:
    - actions:
        - read
      scopes:
        - "*"
    - actions:
        - create
      scopes:
        - Project
  providers:
    kubernetes:
      enabled: true
    enable_native: true
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
`

	// Run the resolver
	err := config.NewResolver[Security]().
		SetConfigData([]byte(testYamlInput)).
		Resolve(&Security{}).
		Verify()

	assert.ErrorContains(t, err, "cannot have multiple authorization providers enabled at the same time")
}

// TestSecurity_VerifyProviderSingularity checks that at least one authz provider is enabled
// when auth is enabled
func TestSecurity_VerifyK8sProviderSingularity(t *testing.T) {
	testYamlInput := `
readonly: false
encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
enable_auth: true
authentication:
  disable_sign_up: true
  providers:
    enable_native: true
authorization:
  guest_permissions:
    - actions:
        - read
      scopes:
        - "*"
    - actions:
        - create
      scopes:
        - Project
  providers:
    enable_native: false
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
`

	// Run the resolver
	err := config.NewResolver[Security]().
		SetConfigData([]byte(testYamlInput)).
		Resolve(&Security{}).
		Verify()

	assert.ErrorContains(t, err, "impossible to enable auth if no authorization provider is setup")
}

// TestSecurity_VerifyK8sValid checks a valid k8s security configuration
func TestSecurity_VerifyK8sValid(t *testing.T) {
	testYamlInput := `
readonly: false
encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
enable_auth: true
authentication:
  disable_sign_up: true
  providers:
    enable_native: true
authorization:
  guest_permissions:
    - actions:
        - read
      scopes:
        - "*"
    - actions:
        - create
      scopes:
        - Project
  providers:
    kubernetes:
      enabled: true
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
`

	// Run the resolver
	err := config.NewResolver[Security]().
		SetConfigData([]byte(testYamlInput)).
		Resolve(&Security{}).
		Verify()

	assert.NoError(t, err)
}
