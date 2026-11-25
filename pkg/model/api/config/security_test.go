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
	"github.com/sirupsen/logrus"
	logrustest "github.com/sirupsen/logrus/hooks/test"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestContentSecurityPolicy_Verify(t *testing.T) {
	testSuite := []struct {
		title    string
		yaml     string
		expected ContentSecurityPolicy
	}{
		{
			title:    "default policy",
			yaml:     "",
			expected: ContentSecurityPolicy{Policy: DefaultContentSecurityPolicy},
		},
		{
			title: "custom policy",
			yaml: `
content_security_policy:
  policy: "script-src 'self'; object-src 'none'"
`,
			expected: ContentSecurityPolicy{Policy: "script-src 'self'; object-src 'none'"},
		},
		{
			title: "policy written on several lines",
			yaml: `
content_security_policy:
  policy: |
    script-src 'self' 'unsafe-eval';
    object-src   'none'
`,
			expected: ContentSecurityPolicy{Policy: "script-src 'self' 'unsafe-eval'; object-src 'none'"},
		},
		{
			title: "disabled policy",
			yaml: `
content_security_policy:
  disable: true
`,
			expected: ContentSecurityPolicy{Disable: true},
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			security := Security{}
			require.NoError(t, config.NewResolver[Security]().
				SetConfigData([]byte(test.yaml)).
				Resolve(&security).
				Verify())
			assert.Equal(t, test.expected, security.ContentSecurityPolicy)
		})
	}
}

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

func TestCORSConfig_Verify(t *testing.T) {
	testSuite := []struct {
		title            string
		config           CORSConfig
		expectedOrigins  []string
		expectedWarnings []string
		errMessage       string
	}{
		{
			title:  "disabled CORS is not verified",
			config: CORSConfig{AllowCredentials: true},
		},
		{
			title:           "every origin is allowed by default",
			config:          CORSConfig{Enable: true},
			expectedOrigins: []string{"*"},
		},
		{
			title:           "exact origins",
			config:          CORSConfig{Enable: true, AllowOrigins: []string{"https://perses.dev", "http://localhost:3000"}, AllowCredentials: true},
			expectedOrigins: []string{"https://perses.dev", "http://localhost:3000"},
		},
		{
			title:            "wildcard patterns are deprecated",
			config:           CORSConfig{Enable: true, AllowOrigins: []string{"https://*.perses.dev", "https://perses.dev", "https://app?.perses.dev"}},
			expectedOrigins:  []string{"https://*.perses.dev", "https://perses.dev", "https://app?.perses.dev"},
			expectedWarnings: []string{`"https://*.perses.dev" of security.cors.allow_origins is a wildcard pattern`, `"https://app?.perses.dev" of security.cors.allow_origins is a wildcard pattern`},
		},
		{
			title:           "'*' after an exact origin without credentials",
			config:          CORSConfig{Enable: true, AllowOrigins: []string{"https://perses.dev", "*"}},
			expectedOrigins: []string{"https://perses.dev", "*"},
		},
		{
			title:            "'*' after an exact origin is deprecated with credentials",
			config:           CORSConfig{Enable: true, AllowOrigins: []string{"https://perses.dev", "*", "*"}, AllowCredentials: true},
			expectedOrigins:  []string{"https://perses.dev", "*", "*"},
			expectedWarnings: []string{"security.cors.allow_origins contains '*' while security.cors.allow_credentials is true"},
		},
		{
			title:           "'*' after a wildcard pattern is deprecated with credentials",
			config:          CORSConfig{Enable: true, AllowOrigins: []string{"https://*.perses.dev", "*"}, AllowCredentials: true},
			expectedOrigins: []string{"https://*.perses.dev", "*"},
			expectedWarnings: []string{
				"security.cors.allow_origins contains '*' while security.cors.allow_credentials is true",
				`"https://*.perses.dev" of security.cors.allow_origins is a wildcard pattern`,
			},
		},
		{
			title:      "'*' as first origin cannot be used with credentials",
			config:     CORSConfig{Enable: true, AllowOrigins: []string{"*", "https://perses.dev"}, AllowCredentials: true},
			errMessage: "security.cors.allow_credentials cannot be true when the first entry of security.cors.allow_origins is '*'",
		},
		{
			title:      "the default origin cannot be used with credentials",
			config:     CORSConfig{Enable: true, AllowCredentials: true},
			errMessage: "security.cors.allow_credentials cannot be true when the first entry of security.cors.allow_origins is '*'",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			origHooks := logrus.StandardLogger().ReplaceHooks(make(logrus.LevelHooks))
			t.Cleanup(func() {
				logrus.StandardLogger().ReplaceHooks(origHooks)
			})
			hook := logrustest.NewLocal(logrus.StandardLogger())

			err := test.config.Verify()
			if test.errMessage != "" {
				assert.ErrorContains(t, err, test.errMessage)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.expectedOrigins, test.config.AllowOrigins)
			var warnings []string
			for _, entry := range hook.AllEntries() {
				if entry.Level == logrus.WarnLevel {
					warnings = append(warnings, entry.Message)
				}
			}
			require.Len(t, warnings, len(test.expectedWarnings))
			for i, expectedWarning := range test.expectedWarnings {
				assert.Contains(t, warnings[i], expectedWarning)
				assert.Contains(t, warnings[i], "in v0.58.0")
				assert.Contains(t, warnings[i], "https://github.com/perses/perses/issues/4721")
			}
		})
	}
}

func TestIsCORSOriginPattern(t *testing.T) {
	assert.False(t, IsCORSOriginPattern("*"))
	assert.False(t, IsCORSOriginPattern("https://perses.dev"))
	assert.True(t, IsCORSOriginPattern("https://*.perses.dev"))
	assert.True(t, IsCORSOriginPattern("https://app?.perses.dev"))
	assert.True(t, IsCORSOriginPattern("http://localhost:*"))
}
