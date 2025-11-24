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

package proxy

import (
	"crypto/tls"
	"testing"

	datasourceSQL "github.com/perses/perses/pkg/model/api/v1/datasource/sql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var (
	mySQLAddress    = "localhost:3306"
	postgresAddress = "localhost:5432"
)

func TestSQLProxy_sqlOpen(t *testing.T) {
	testSuite := []struct {
		name          string
		proxy         *sqlProxy
		tlsConfig     *tls.Config
		expectError   bool
		errorContains string
	}{
		{
			name: "unsupported driver",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver: "unsupported",
					Host:   mySQLAddress,
				},
			},
			expectError:   true,
			errorContains: "unsupported database driver",
		},
		{
			name: "postgres with tls and sslmode disable",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverPostgreSQL,
					Host:     postgresAddress,
					Database: "perses",
					Postgres: &datasourceSQL.PostgresConfig{
						SSLMode: "disable",
					},
				},
			},
			tlsConfig:     &tls.Config{MinVersion: tls.VersionTLS12},
			expectError:   true,
			errorContains: "cannot use custom TLSConfig with sslmode=disable",
		},
		{
			name: "mysql success",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMySQL,
					Host:     mySQLAddress,
					Database: "testdb",
				},
				password: "password",
			},
			expectError: false,
		},
		{
			name: "postgres success",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverPostgreSQL,
					Host:     postgresAddress,
					Database: "testdb",
				},
				password: "password",
			},
			expectError: false,
		},
		{
			name: "postgres no password",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver: datasourceSQL.DriverPostgreSQL,
					Host:   postgresAddress,
				},
			},
			expectError: false,
		},
	}

	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			db, err := test.proxy.sqlOpen(test.tlsConfig)
			if test.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), test.errorContains)
			} else {
				assert.NoError(t, err)
				require.NotNil(t, db)
				_ = db.Close()
			}
		})
	}
}
