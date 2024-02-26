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
	"encoding/hex"
	"encoding/json"
	"path"
	"testing"
	"time"

	"github.com/perses/common/config"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/prometheus/common/model"
	"github.com/stretchr/testify/assert"
)

func defaultConfig() Config {
	cfg, _ := Resolve("")
	return cfg
}

func TestJSONMarshalConfig(t *testing.T) {
	testSuite := []struct {
		title string
		cfg   Config
		jason string
	}{
		{
			title: "empty config",
			cfg:   Config{},
			jason: `{
  "security": {
    "readonly": false,
    "enable_auth": false,
    "authorization": {},
    "authentication": {
      "disable_sign_up": false,
      "providers": {
        "enable_native": false
      }
    }
  },
  "database": {},
  "schemas": {},
  "provisioning": {}
}`,
		},
		{
			title: "default config",
			cfg:   defaultConfig(),
			jason: `{
  "security": {
    "readonly": false,
    "encryption_key": "\u003csecret\u003e",
    "enable_auth": false,
    "authorization": {
      "check_latest_update_interval": "30s"
    },
    "authentication": {
      "access_token_ttl": "15m",
      "refresh_token_ttl": "1d",
      "disable_sign_up": false,
      "providers": {
        "enable_native": false
      }
    }
  },
  "database": {
    "file": {
      "folder": "./local_db",
      "extension": "yaml",
      "case_sensitive": false
    }
  },
  "schemas": {
    "panels_path": "schemas/panels",
    "queries_path": "schemas/queries",
    "datasources_path": "schemas/datasources",
    "variables_path": "schemas/variables",
    "interval": "1h"
  },
  "provisioning": {
    "interval": "1h"
  },
  "ephemeral_dashboards_cleanup_interval": "1d"
}`,
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			data, err := json.MarshalIndent(test.cfg, "", "  ")
			assert.NoError(t, err)
			assert.Equal(t, test.jason, string(data))
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
			title: "perses dev config",
			jason: `
{
  "security": {
    "readonly": false,
    "encryption_key": "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc",
    "enable_auth": true,
    "authorization": {
      "guest_permissions": [
        {
          "actions": [
            "read"
          ],
          "scopes": [
            "*"
          ]
        },
        {
          "actions": [
            "create"
          ],
          "scopes": [
            "Project"
          ]
        }
      ]
    }
  },
  "database": {
    "file": {
      "folder": "dev/local_db",
      "extension": "json"
    }
  },
  "schemas": {
    "panels_path": "cue/schemas/panels",
    "queries_path": "cue/schemas/queries",
    "datasources_path": "cue/schemas/datasources",
    "variables_path": "cue/schemas/variables",
    "interval": "5m"
  },
  "important_dashboards": [
    {
      "project": "perses",
      "dashboard": "Demo"
    },
    {
      "project": "testing",
      "dashboard": "DuplicatePanels"
    },
    {
      "project": "Unknown",
      "dashboard": "Dashboard"
    }
  ],
  "information": "# Hello World\n## File Database setup",
  "provisioning": {
    "folders": [
      "dev/data"
    ],
    "interval": "1h"
  },
  "ephemeral_dashboards_cleanup_interval": "2h"
}`,
			result: Config{
				Security: Security{
					Readonly:      false,
					EncryptionKey: "=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc",
					EnableAuth:    true,
					Authorization: AuthorizationConfig{
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
				Database: Database{
					File: &File{
						Folder:    "dev/local_db",
						Extension: "json",
					},
				},
				Schemas: Schemas{
					PanelsPath:      path.Join("cue", DefaultPanelsPath),
					QueriesPath:     path.Join("cue", DefaultQueriesPath),
					DatasourcesPath: path.Join("cue", DefaultDatasourcesPath),
					VariablesPath:   path.Join("cue", DefaultVariablesPath),
					Interval:        model.Duration(5 * time.Minute),
				},
				ImportantDashboards: []dashboardSelector{
					{
						Project:   "perses",
						Dashboard: "Demo",
					},
					{
						Project:   "testing",
						Dashboard: "DuplicatePanels",
					},
					{
						Project:   "Unknown",
						Dashboard: "Dashboard",
					},
				},
				Information: "# Hello World\n## File Database setup",
				Provisioning: ProvisioningConfig{
					Folders: []string{
						"dev/data",
					},
					Interval: model.Duration(defaultInterval),
				},
				EphemeralDashboardsCleanupInterval: model.Duration(2 * time.Hour),
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			c := Config{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), &c))
			assert.Equal(t, test.result, c)
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
    guest_permissions:
      - actions:
          - read
        scopes:
          - "*"
      - actions:
          - create
        scopes:
          - Project

database:
  file:
    folder: "dev/local_db"
    extension: "json"

provisioning:
  folders:
  - "dev/data"

schemas:
  panels_path: "cue/schemas/panels"
  queries_path: "cue/schemas/queries"
  datasources_path: "cue/schemas/datasources"
  variables_path: "cue/schemas/variables"
  interval: "5m"

important_dashboards:
  - project: "perses"
    dashboard: "Demo"
  - project: "testing"
    dashboard: "DuplicatePanels"
  - project: "Unknown"
    dashboard: "Dashboard"

information: |-
  # Hello World
  ## File Database setup

ephemeral_dashboards_cleanup_interval: "2h"
`,
			result: Config{
				Security: Security{
					Readonly:      false,
					EncryptionKey: secret.Hidden(hex.EncodeToString([]byte("=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"))),
					EnableAuth:    true,
					Authorization: AuthorizationConfig{
						CheckLatestUpdateInterval: model.Duration(defaultCacheInterval),
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
					Authentication: AuthenticationConfig{
						AccessTokenTTL:  model.Duration(DefaultAccessTokenTTL),
						RefreshTokenTTL: model.Duration(DefaultRefreshTokenTTL),
						DisableSignUp:   false,
						Providers: AuthProviders{
							EnableNative: true,
						},
					},
				},
				Database: Database{
					File: &File{
						Folder:    "dev/local_db",
						Extension: "json",
					},
				},
				Schemas: Schemas{
					PanelsPath:      path.Join("cue", DefaultPanelsPath),
					QueriesPath:     path.Join("cue", DefaultQueriesPath),
					DatasourcesPath: path.Join("cue", DefaultDatasourcesPath),
					VariablesPath:   path.Join("cue", DefaultVariablesPath),
					Interval:        model.Duration(5 * time.Minute),
				},
				ImportantDashboards: []dashboardSelector{
					{
						Project:   "perses",
						Dashboard: "Demo",
					},
					{
						Project:   "testing",
						Dashboard: "DuplicatePanels",
					},
					{
						Project:   "Unknown",
						Dashboard: "Dashboard",
					},
				},
				Information: "# Hello World\n## File Database setup",
				Provisioning: ProvisioningConfig{
					Folders: []string{
						"dev/data",
					},
					Interval: model.Duration(defaultInterval),
				},
				EphemeralDashboardsCleanupInterval: model.Duration(2 * time.Hour),
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			c := Config{}
			assert.NoError(t, config.NewResolver[Config]().
				SetConfigData([]byte(test.yamele)).
				SetEnvPrefix("PERSES").
				Resolve(&c).
				Verify())
			assert.NoError(t, c.Verify())
			assert.Equal(t, test.result, c)
		})
	}
}
