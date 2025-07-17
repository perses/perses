// Copyright 2025 The Perses Authors
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
	"encoding/hex"
	"net/http"
	"testing"
	"time"

	"github.com/perses/common/config"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/perses/perses/pkg/model/api/v1/secret"
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
			title: "valid k8s authz configuration",
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

// This test looks to ensure backwards compatibility for existing configs, checking that defining
// the check_latest_update_interval and guest_permissions at their old locations copies them to
// their new ones
func TestSecurity_VerifyNative(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result Config
	}{
		{
			title: "perses dev config",
			yamele: `
security:
  readonly: false
  encryption_key: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"
  enable_auth: true
  authentication:
    providers:
      enable_native: true
  authorization:
    check_latest_update_interval: 10m
    guest_permissions:
      - actions:
          - read
        scopes:
          - "*"
      - actions:
          - create
        scopes:
          - Project
`,
			result: Config{
				Security: Security{
					Readonly: false,
					Cookie: Cookie{
						SameSite: SameSite(http.SameSiteLaxMode),
						Secure:   false,
					},
					EncryptionKey: secret.Hidden(hex.EncodeToString([]byte("=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"))),
					EnableAuth:    true,
					Authorization: AuthorizationConfig{
						Provider: AuthorizationProvider{
							Native: NativeAuthorizationProvider{
								Enable:                    true,
								CheckLatestUpdateInterval: common.Duration(time.Minute * 10),
								GuestPermissions: []*role.Permission{
									{
										Actions: []role.Action{
											role.ReadAction,
										},
										Scopes: []role.Scope{
											role.WildcardScope,
										},
									},
									{
										Actions: []role.Action{
											role.CreateAction,
										},
										Scopes: []role.Scope{
											role.ProjectScope,
										},
									},
								},
							},
						},
					},
					Authentication: AuthenticationConfig{
						AccessTokenTTL:  common.Duration(DefaultAccessTokenTTL),
						RefreshTokenTTL: common.Duration(DefaultRefreshTokenTTL),
						DisableSignUp:   false,
						Providers: AuthProviders{
							EnableNative: true,
						},
					},
				},
				Database: Database{
					File: &File{
						Folder:    "./local_db",
						Extension: "yaml",
					},
				},
				Frontend: Frontend{
					ImportantDashboards: nil,
					Information:         "",
					TimeRange: TimeRange{
						DisableCustomTimeRange: false,
						Options:                defaultTimeRangeOptions,
					},
				},
				Plugin: Plugin{
					Path:        "plugins",
					ArchivePath: "plugins-archive",
				},
				Provisioning: ProvisioningConfig{
					Interval: common.Duration(defaultInterval),
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			c := Config{}
			assert.NoError(t, config.NewResolver[Config]().
				SetConfigData([]byte(test.yamele)).
				Resolve(&c).
				Verify())
			assert.NoError(t, c.Verify())
			assert.Equal(t, test.result, c)
		})
	}
}
