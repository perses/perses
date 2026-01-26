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

package sql

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

func TestUnmarshalJSONConfig(t *testing.T) {
	testSuite := []struct {
		title     string
		jason     string
		result    Config
		expectErr bool
	}{
		{
			title: "basic postgres config",
			jason: `
{
  "driver": "postgres",
  "host": "localhost:5432",
  "database": "test",
  "postgres": {
    "sslMode": "disable"
  }
}
`,
			result: Config{
				Driver:   DriverPostgreSQL,
				Host:     "localhost:5432",
				Database: "test",
				Postgres: &PostgresConfig{
					SSLMode: SSLModeDisable,
				},
			},
		},
		{
			title: "mysql config",
			jason: `
{
  "driver": "mysql",
  "host": "localhost:3306",
  "database": "testdb",
  "secret": "mysql-secret"
}
`,
			result: Config{
				Driver:   DriverMySQL,
				Host:     "localhost:3306",
				Database: "testdb",
				Secret:   "mysql-secret",
			},
		},
		{
			title: "mariadb config",
			jason: `
{
  "driver": "mariadb",
  "host": "localhost:3306",
  "database": "testdb",
  "secret": "mariadb-secret"
}
`,
			result: Config{
				Driver:   DriverMariaDB,
				Host:     "localhost:3306",
				Database: "testdb",
				Secret:   "mariadb-secret",
			},
		},
		{
			title: "mariadb config with params",
			jason: `
{
  "driver": "mariadb",
  "host": "localhost:3307",
  "database": "testdb",
  "mariadb": {
    "params": {
      "charset": "utf8mb4",
      "collation": "utf8mb4_unicode_ci"
    },
    "maxAllowedPacket": 33554432,
    "timeout": 20000000000,
    "readTimeout": 15000000000,
    "writeTimeout": 15000000000
  }
}
`,
			result: Config{
				Driver:   DriverMariaDB,
				Host:     "localhost:3307",
				Database: "testdb",
				MariaDB: &MySQLConfig{
					Params: map[string]string{
						"charset":   "utf8mb4",
						"collation": "utf8mb4_unicode_ci",
					},
					MaxAllowedPacket: 33554432,
					Timeout:          20000000000,
					ReadTimeout:      15000000000,
					WriteTimeout:     15000000000,
				},
			},
		},
		{
			title: "mysql config with params",
			jason: `
{
  "driver": "mysql",
  "host": "localhost:3306",
  "database": "testdb",
  "mysql": {
    "params": {
      "charset": "utf8mb4",
      "parseTime": "true"
    },
    "maxAllowedPacket": 67108864,
    "timeout": 30000000000,
    "readTimeout": 10000000000,
    "writeTimeout": 10000000000
  }
}
`,
			result: Config{
				Driver:   DriverMySQL,
				Host:     "localhost:3306",
				Database: "testdb",
				MySQL: &MySQLConfig{
					Params: map[string]string{
						"charset":   "utf8mb4",
						"parseTime": "true",
					},
					MaxAllowedPacket: 67108864,
					Timeout:          30000000000,
					ReadTimeout:      10000000000,
					WriteTimeout:     10000000000,
				},
			},
		},
		{
			title: "postgres config with all options",
			jason: `
{
  "driver": "postgres",
  "host": "localhost:5432",
  "database": "test",
  "postgres": {
    "maxConns": 50,
    "connectTimeout": 5000000000,
    "prepareThreshold": 5,
    "sslMode": "require",
    "options": "-c search_path=myschema"
  }
}
`,
			result: Config{
				Driver:   DriverPostgreSQL,
				Host:     "localhost:5432",
				Database: "test",
				Postgres: &PostgresConfig{
					MaxConns:         50,
					ConnectTimeout:   5000000000,
					PrepareThreshold: func() *int { i := 5; return &i }(),
					SSLMode:          SSLModeRequire,
					Options:          "-c search_path=myschema",
				},
			},
		},
		{
			title: "invalid SSL mode",
			jason: `
{
  "driver": "postgres",
  "host": "localhost:5432",
  "database": "test",
  "postgres": {
    "sslMode": "notreal"
  }
}
`,
			expectErr: true,
		},
		{
			title: "missing driver",
			jason: `
{
  "host": "localhost:5432",
  "database": "test"
}
`,
			expectErr: true,
		},
		{
			title: "missing host",
			jason: `
{
  "driver": "postgres",
  "database": "test"
}
`,
			expectErr: true,
		},
		{
			title: "missing database",
			jason: `
{
  "driver": "postgres",
  "host": "localhost:5432"
}
`,
			expectErr: true,
		},
		{
			title: "unsupported driver",
			jason: `
{
  "driver": "oracle",
  "host": "localhost:1521",
  "database": "test"
}
`,
			expectErr: true,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Config{}
			err := json.Unmarshal([]byte(test.jason), &result)
			if test.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, test.result, result)
			}
		})
	}
}

func TestUnmarshalYAMLConfig(t *testing.T) {
	testSuite := []struct {
		title     string
		yamele    string
		result    Config
		expectErr bool
	}{
		{
			title: "basic postgres config",
			yamele: `
driver: postgres
host: localhost:5432
database: test
postgres:
  sslMode: disable
`,
			result: Config{
				Driver:   DriverPostgreSQL,
				Host:     "localhost:5432",
				Database: "test",
				Postgres: &PostgresConfig{
					SSLMode: SSLModeDisable,
				},
			},
		},
		{
			title: "mysql config",
			yamele: `
driver: mysql
host: localhost:3306
database: testdb
secret: mysql-secret
`,
			result: Config{
				Driver:   DriverMySQL,
				Host:     "localhost:3306",
				Database: "testdb",
				Secret:   "mysql-secret",
			},
		},
		{
			title: "mariadb config",
			yamele: `
driver: mariadb
host: localhost:3306
database: testdb
secret: mariadb-secret
`,
			result: Config{
				Driver:   DriverMariaDB,
				Host:     "localhost:3306",
				Database: "testdb",
				Secret:   "mariadb-secret",
			},
		},
		{
			title: "mariadb config with params",
			yamele: `
driver: mariadb
host: localhost:3307
database: testdb
mariadb:
  params:
    charset: utf8mb4
    collation: utf8mb4_unicode_ci
  maxAllowedPacket: 33554432
  timeout: 20s
  readTimeout: 15s
  writeTimeout: 15s
`,
			result: Config{
				Driver:   DriverMariaDB,
				Host:     "localhost:3307",
				Database: "testdb",
				MariaDB: &MySQLConfig{
					Params: map[string]string{
						"charset":   "utf8mb4",
						"collation": "utf8mb4_unicode_ci",
					},
					MaxAllowedPacket: 33554432,
					Timeout:          20000000000,
					ReadTimeout:      15000000000,
					WriteTimeout:     15000000000,
				},
			},
		},
		{
			title: "mysql config with params",
			yamele: `
driver: mysql
host: localhost:3306
database: testdb
mysql:
  params:
    charset: utf8mb4
    parseTime: "true"
  maxAllowedPacket: 67108864
  timeout: 30s
  readTimeout: 10s
  writeTimeout: 10s
`,
			result: Config{
				Driver:   DriverMySQL,
				Host:     "localhost:3306",
				Database: "testdb",
				MySQL: &MySQLConfig{
					Params: map[string]string{
						"charset":   "utf8mb4",
						"parseTime": "true",
					},
					MaxAllowedPacket: 67108864,
					Timeout:          30000000000,
					ReadTimeout:      10000000000,
					WriteTimeout:     10000000000,
				},
			},
		},
		{
			title: "postgres config with all SSL modes",
			yamele: `
driver: postgres
host: localhost:5432
database: test
postgres:
  sslMode: verify-full
`,
			result: Config{
				Driver:   DriverPostgreSQL,
				Host:     "localhost:5432",
				Database: "test",
				Postgres: &PostgresConfig{
					SSLMode: SSLModeVerifyFull,
				},
			},
		},
		{
			title: "invalid SSL mode in yaml",
			yamele: `
driver: postgres
host: localhost:5432
database: test
postgres:
  sslMode: invalid
`,
			expectErr: true,
		},
		{
			title: "missing driver in yaml",
			yamele: `
host: localhost:5432
database: test
`,
			expectErr: true,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Config{}
			err := yaml.Unmarshal([]byte(test.yamele), &result)
			if test.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, test.result, result)
			}
		})
	}
}

func TestValidateConfig(t *testing.T) {
	testSuite := []struct {
		name      string
		config    Config
		expectErr bool
		errMsg    string
	}{
		{
			name: "valid mysql config",
			config: Config{
				Driver:   DriverMySQL,
				Host:     "localhost:3306",
				Database: "test",
			},
			expectErr: false,
		},
		{
			name: "valid mariadb config",
			config: Config{
				Driver:   DriverMariaDB,
				Host:     "localhost:3306",
				Database: "test",
			},
			expectErr: false,
		},
		{
			name: "valid postgres config",
			config: Config{
				Driver:   DriverPostgreSQL,
				Host:     "localhost:5432",
				Database: "test",
			},
			expectErr: false,
		},
		{
			name: "missing driver",
			config: Config{
				Host:     "localhost:5432",
				Database: "test",
			},
			expectErr: true,
			errMsg:    "driver is required",
		},
		{
			name: "unsupported driver",
			config: Config{
				Driver:   "mssql",
				Host:     "localhost:1433",
				Database: "test",
			},
			expectErr: true,
			errMsg:    "not supported",
		},
		{
			name: "missing host",
			config: Config{
				Driver:   DriverMySQL,
				Database: "test",
			},
			expectErr: true,
			errMsg:    "host cannot be empty",
		},
		{
			name: "missing database",
			config: Config{
				Driver: DriverMySQL,
				Host:   "localhost:3306",
			},
			expectErr: true,
			errMsg:    "database cannot be empty",
		},
	}

	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			err := test.config.validate()
			if test.expectErr {
				assert.Error(t, err)
				if test.errMsg != "" {
					assert.Contains(t, err.Error(), test.errMsg)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestPostgresConfigValidation(t *testing.T) {
	testSuite := []struct {
		name      string
		config    PostgresConfig
		expectErr bool
		errMsg    string
	}{
		{
			name: "valid disable ssl mode",
			config: PostgresConfig{
				SSLMode: SSLModeDisable,
			},
			expectErr: false,
		},
		{
			name: "valid allow ssl mode",
			config: PostgresConfig{
				SSLMode: SSLModeAllow,
			},
			expectErr: false,
		},
		{
			name: "valid prefer ssl mode",
			config: PostgresConfig{
				SSLMode: SSLModePreferable,
			},
			expectErr: false,
		},
		{
			name: "valid require ssl mode",
			config: PostgresConfig{
				SSLMode: SSLModeRequire,
			},
			expectErr: false,
		},
		{
			name: "valid verify-full ssl mode",
			config: PostgresConfig{
				SSLMode: SSLModeVerifyFull,
			},
			expectErr: false,
		},
		{
			name: "valid verify-ca ssl mode",
			config: PostgresConfig{
				SSLMode: SSLModeVerifyCA,
			},
			expectErr: false,
		},
		{
			name: "invalid ssl mode",
			config: PostgresConfig{
				SSLMode: "invalid-mode",
			},
			expectErr: true,
			errMsg:    "unknown ssl mode",
		},
		{
			name: "empty ssl mode is valid",
			config: PostgresConfig{
				SSLMode: "",
			},
			expectErr: false,
		},
	}

	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			err := test.config.validate()
			if len(test.errMsg) > 0 {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), test.errMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
