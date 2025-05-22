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

// TestSecurity_VerifyK8s checks that the k8s authz can't be enabled without authn being enabled
func TestSecurity_VerifyK8s(t *testing.T) {
	testYamlInput := `
readonly: false
encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
enable_auth: true
authentication:
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
  kubernetes: true
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

	assert.ErrorContains(t, err, "k8s authz must be enabled alongside k8s authn")
}

// TestSecurity_VerifyProviderSingularity checks that the k8s authn can't be enabled with other authn providers
func TestSecurity_VerifyK8sProviderSingularity(t *testing.T) {
	testYamlInput := `
readonly: false
encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
enable_auth: true
authentication:
  providers:
    enable_native: true
    kubernetes:
      enabled: true
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

	assert.ErrorContains(t, err, "cannot enabled k8s authn alongside other authn providers")
}

// TestSecurity_VerifyK8sValid checks a valid k8s security configuration
func TestSecurity_VerifyK8sValid(t *testing.T) {
	testYamlInput := `
readonly: false
encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
enable_auth: true
authentication:
  providers:
    kubernetes:
      enabled: true
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
  kubernetes: true
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
