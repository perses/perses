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

package proxy

import (
	"context"
	"crypto/tls"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"testing"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	datasourceSQL "github.com/perses/spec/go/datasource/proxy/sql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var (
	mySQLAddress    = "localhost:3306"
	mariaDBAddress  = "localhost:3307"
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
			name: "mysql with username",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMySQL,
					Host:     mySQLAddress,
					Database: "testdb",
				},
				username: "testuser",
				password: "password",
			},
			expectError: false,
		},
		{
			name: "mysql with custom config",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMySQL,
					Host:     mySQLAddress,
					Database: "testdb",
					MySQL: &datasourceSQL.MySQLConfig{
						Params: map[string]string{
							"charset":   "utf8mb4",
							"parseTime": "true",
						},
						MaxAllowedPacket: 67108864,
					},
				},
				password: "password",
			},
			expectError: false,
		},
		{
			name: "mariadb success",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMariaDB,
					Host:     mariaDBAddress,
					Database: "testdb",
				},
				password: "password",
			},
			expectError: false,
		},
		{
			name: "mariadb with username and password",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMariaDB,
					Host:     mariaDBAddress,
					Database: "testdb",
				},
				username: "mariauser",
				password: "mariapass",
			},
			expectError: false,
		},
		{
			name: "mariadb with custom config",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMariaDB,
					Host:     mariaDBAddress,
					Database: "testdb",
					MariaDB: &datasourceSQL.MySQLConfig{
						Params: map[string]string{
							"charset":   "utf8mb4",
							"collation": "utf8mb4_unicode_ci",
						},
						MaxAllowedPacket: 33554432,
					},
				},
				username: "mariauser",
				password: "mariapass",
			},
			expectError: false,
		},
		{
			name: "mariadb with tls",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMariaDB,
					Host:     mariaDBAddress,
					Database: "testdb",
					MariaDB: &datasourceSQL.MySQLConfig{
						Params: map[string]string{
							"charset": "utf8mb4",
						},
					},
				},
				name:     "mariadb-ds",
				project:  "testproject",
				username: "mariauser",
				password: "mariapass",
			},
			tlsConfig:   &tls.Config{MinVersion: tls.VersionTLS12},
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
			name: "postgres with username",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverPostgreSQL,
					Host:     postgresAddress,
					Database: "testdb",
					Postgres: &datasourceSQL.PostgresConfig{
						SSLMode: datasourceSQL.SSLModeDisable,
					},
				},
				username: "pguser",
				password: "pgpass",
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
		{
			name: "postgres with all ssl modes - prefer",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverPostgreSQL,
					Host:     postgresAddress,
					Database: "testdb",
					Postgres: &datasourceSQL.PostgresConfig{
						SSLMode: datasourceSQL.SSLModePreferable,
					},
				},
			},
			expectError: false,
		},
		{
			name: "postgres with ssl mode require and tls",
			proxy: &sqlProxy{
				config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverPostgreSQL,
					Host:     postgresAddress,
					Database: "testdb",
					Postgres: &datasourceSQL.PostgresConfig{
						SSLMode: datasourceSQL.SSLModeRequire,
					},
				},
			},
			tlsConfig:   &tls.Config{MinVersion: tls.VersionTLS12},
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

// TestHTTPProxy_getToken_honorsTLSConfig ensures the OAuth token request is
// performed with the transport built from the datasource secret's TLS config.
// The token endpoint is served over TLS with a self-signed certificate, so the
// request only succeeds when the configured transport (trusting that certificate
// through the secret's CA) is used. If getToken stored a plain http.Client value
// instead of a *http.Client under the oauth2.HTTPClient context key, oauth2 would
// silently fall back to http.DefaultClient and the handshake would fail.
func TestHTTPProxy_getToken_honorsTLSConfig(t *testing.T) {
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"secret-token","token_type":"Bearer","expires_in":3600}`))
	}))
	defer server.Close()

	caPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: server.Certificate().Raw})

	h := &httpProxy{
		secret: &v1.SecretSpec{
			TLSConfig: &secretModel.TLSConfig{
				CA:         string(caPEM),
				MinVersion: "TLS12",
				MaxVersion: "TLS13",
			},
		},
	}

	oauth := &secretModel.OAuth{
		ClientID:     "client-id",
		ClientSecret: "client-secret",
		TokenURL:     server.URL,
	}

	token, err := h.getToken(context.Background(), oauth)
	require.NoError(t, err)
	require.NotNil(t, token)
	assert.Equal(t, "secret-token", token.AccessToken)
}
