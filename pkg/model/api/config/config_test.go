// Copyright 2024 The Perses Authors
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
	"net/http"
	"testing"
	"time"

	"github.com/perses/common/config"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/perses/perses/pkg/model/api/v1/secret"
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
    "cookie": {
      "secure": false
    },
    "enable_auth": false,
    "authorization": {},
    "authentication": {
      "disable_sign_up": false,
      "providers": {
        "enable_native": false
      }
    },
    "cors": {
      "enable": false
    }
  },
  "database": {},
  "dashboard": {},
  "provisioning": {},
  "datasource": {
    "global": {
      "disable": false
    },
    "project": {
      "disable": false
    },
    "disable_local": false
  },
  "variable": {
    "global": {
      "disable": false
    },
    "project": {
      "disable": false
    },
    "disable_local": false
  },
  "ephemeral_dashboard": {
    "enable": false,
    "cleanup_interval": "0s"
  },
  "frontend": {
    "disable": false,
    "explorer": {
      "enable": false
    },
    "time_range": {
      "disable_custom": false,
      "disable_zoom": false
    }
  },
  "plugin": {
    "enable_dev": false
  }
}`,
		},
		{
			title: "default config",
			cfg:   defaultConfig(),
			jason: `{
  "security": {
    "readonly": false,
    "cookie": {
      "same_site": "lax",
      "secure": false
    },
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
    },
    "cors": {
      "enable": false
    }
  },
  "database": {
    "file": {
      "folder": "./local_db",
      "extension": "yaml",
      "case_sensitive": false
    }
  },
  "dashboard": {},
  "provisioning": {
    "interval": "1h"
  },
  "datasource": {
    "global": {
      "disable": false
    },
    "project": {
      "disable": false
    },
    "disable_local": false
  },
  "variable": {
    "global": {
      "disable": false
    },
    "project": {
      "disable": false
    },
    "disable_local": false
  },
  "ephemeral_dashboard": {
    "enable": false,
    "cleanup_interval": "0s"
  },
  "frontend": {
    "disable": false,
    "explorer": {
      "enable": false
    },
    "time_range": {
      "disable_custom": false,
      "disable_zoom": false,
      "options": [
        "5m",
        "15m",
        "30m",
        "1h",
        "6h",
        "12h",
        "1d",
        "1w",
        "2w"
      ]
    }
  },
  "plugin": {
    "path": "plugins",
    "archive_path": "plugins-archive",
    "enable_dev": false
  }
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
    },
    "cors": {
      "enable": true,
      "allow_origins": ["https://github.com"],
      "allow_methods": ["GET", "POST"],
      "allow_headers": ["X-Custom-Header"],
      "allow_credentials": true,
      "expose_headers": ["Content-Encoding"],
      "max_age": 60
    }
  },
  "database": {
    "file": {
      "folder": "dev/local_db",
      "extension": "json"
    }
  },
  "frontend": {
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
    "information": "# Hello World\n## File Database setup"
  },
  "plugin": { 
    "path": "plugins",
    "archive_path": "plugins-archive"
	},
  "provisioning": {
    "folders": [
      "dev/data"
    ],
    "interval": "1h"
  },
  "ephemeral_dashboard": {
    "cleanup_interval": "2h"
  }
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
					CORS: CORSConfig{
						Enable:           true,
						AllowOrigins:     []string{"https://github.com"},
						AllowMethods:     []string{"GET", "POST"},
						AllowHeaders:     []string{"X-Custom-Header"},
						AllowCredentials: true,
						ExposeHeaders:    []string{"Content-Encoding"},
						MaxAge:           60,
					},
				},
				Database: Database{
					File: &File{
						Folder:    "dev/local_db",
						Extension: "json",
					},
				},
				Frontend: Frontend{
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
				},
				Plugin: Plugin{
					Path:        "plugins",
					ArchivePath: "plugins-archive",
				},
				Provisioning: ProvisioningConfig{
					Folders: []string{
						"dev/data",
					},
					Interval: common.Duration(defaultInterval),
				},
				EphemeralDashboard: EphemeralDashboard{
					Enable:          false,
					CleanupInterval: common.Duration(2 * time.Hour),
				},
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

database:
  file:
    folder: "dev/local_db"
    extension: "json"

provisioning:
  folders:
  - "dev/data"

frontend:
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


ephemeral_dashboard:
  cleanup_interval: "2h"

plugin:
  path: "custom/plugins"
  archive_path: "custom/plugins/archive"
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
						CheckLatestUpdateInterval: common.Duration(defaultCacheInterval),
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
						AccessTokenTTL:  common.Duration(DefaultAccessTokenTTL),
						RefreshTokenTTL: common.Duration(DefaultRefreshTokenTTL),
						DisableSignUp:   false,
						Providers: AuthProviders{
							EnableNative: true,
						},
					},
					CORS: CORSConfig{
						Enable:           true,
						AllowOrigins:     []string{"https://github.com"},
						AllowMethods:     []string{"GET", "POST"},
						AllowHeaders:     []string{"X-Custom-Header"},
						AllowCredentials: true,
						ExposeHeaders:    []string{"Content-Encoding"},
						MaxAge:           60,
					},
				},
				Database: Database{
					File: &File{
						Folder:    "dev/local_db",
						Extension: "json",
					},
				},
				Frontend: Frontend{
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
					TimeRange: TimeRange{
						DisableCustomTimeRange: false,
						Options:                defaultTimeRangeOptions,
					},
				},
				Plugin: Plugin{
					Path:        "custom/plugins",
					ArchivePath: "custom/plugins/archive",
				},
				Provisioning: ProvisioningConfig{
					Folders: []string{
						"dev/data",
					},
					Interval: common.Duration(defaultInterval),
				},
				EphemeralDashboard: EphemeralDashboard{
					Enable:          false,
					CleanupInterval: common.Duration(2 * time.Hour),
				},
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
