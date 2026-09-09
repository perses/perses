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
	"encoding/json"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
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

func TestHTTPProxy_prepareRequest_headerPolicies(t *testing.T) {
	defaultHeaders := http.Header{
		"Accept":            {"application/json", "text/plain"},
		"Authorization":     {"Bearer datasource-token"},
		"Cookie":            {"session=client-session"},
		"Origin":            {"https://configured.example.com"},
		"Referer":           {"https://perses.example.com/dashboard"},
		"X-Configured":      {"configured-value"},
		"X-Forwarded-For":   {"192.0.2.2"},
		"X-Forwarded-Proto": {"http"},
		"X-Real-Ip":         {"192.0.2.2"},
	}
	droppedHeaders := defaultHeaders.Clone()
	droppedHeaders.Del("Origin")
	droppedHeaders.Del("Referer")
	droppedHeaders.Del("X-Configured")
	droppedHeaders[echo.HeaderXForwardedFor] = nil

	for _, test := range []struct {
		name  string
		allow []string
		drop  []string
		want  http.Header
	}{
		{name: "no policy", want: defaultHeaders},
		{name: "empty policies", allow: []string{}, drop: []string{}, want: defaultHeaders},
		{
			name:  "allow names ignore case and preserve multiple values without adding missing headers",
			allow: []string{"aCcEpT", "ACCEPT", "x-configured", "X-Missing"},
			want: http.Header{
				"Accept":          {"application/json", "text/plain"},
				"Authorization":   {"Bearer datasource-token"},
				"X-Configured":    {"configured-value"},
				"X-Forwarded-For": nil,
			},
		},
		{
			name: "drop incoming and configured headers ignoring case",
			drop: []string{"oRiGiN", "REFERER", "x-configured", "x-forwarded-for", "X-Missing"},
			want: droppedHeaders,
		},
		{
			name:  "allow secret authentication explicitly",
			allow: []string{"authorization"},
			want: http.Header{
				"Authorization":   {"Bearer datasource-token"},
				"X-Forwarded-For": nil,
			},
		},
		{name: "drop secret authentication", drop: []string{"AUTHORIZATION"}, want: defaultHeaders},
		{
			name:  "allow only absent headers",
			allow: []string{"X-Missing"},
			want:  http.Header{"Authorization": {"Bearer datasource-token"}, "X-Forwarded-For": nil},
		},
		{
			name:  "if drop and allow are both set, drop must be ignored",
			allow: []string{"aCcEpT", "ACCEPT", "x-configured", "X-Missing"},
			drop:  []string{"Accept"},
			want: http.Header{
				"Accept":          {"application/json", "text/plain"},
				"Authorization":   {"Bearer datasource-token"},
				"X-Configured":    {"configured-value"},
				"X-Forwarded-For": nil,
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/datasource", nil)
			req.Header = http.Header{
				"Accept":          {"application/json", "text/plain"},
				"Authorization":   {"Bearer client-token"},
				"Cookie":          {"session=client-session"},
				"Origin":          {"https://perses.example.com"},
				"Referer":         {"https://perses.example.com/dashboard"},
				"X-Forwarded-For": {"192.0.2.2"},
			}
			h := &httpProxy{
				config: &datasourceHTTP.Config{
					URL: common.MustParseURL("https://datasource.example.com"),
					Headers: map[string]string{
						"Origin":       "https://configured.example.com",
						"X-Configured": "configured-value",
					},
					AllowHeaders: test.allow,
					DropHeaders:  test.drop,
				},
				secret: &v1.SecretSpec{Authorization: secretModel.NewBearerToken("datasource-token")},
			}
			ctx := echo.New().NewContext(req, httptest.NewRecorder())
			require.NoError(t, h.prepareRequest(ctx))
			assert.Equal(t, test.want, req.Header)
			assert.Equal(t, "datasource.example.com", req.Host)
		})
	}
}

func TestHTTPProxy_serve_headerPolicies(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(r.Header)
	}))
	defer server.Close()

	for _, test := range []struct {
		name             string
		allow            []string
		drop             []string
		wantForwardedFor string
	}{
		{name: "default forwards client IP", wantForwardedFor: "192.0.2.1"},
		{name: "allow excludes forwarded IP", allow: []string{"accept"}},
		{name: "drop excludes forwarded IP", drop: []string{"x-forwarded-for", "origin"}},
		{name: "allow includes forwarded IP", allow: []string{"accept", "x-forwarded-for"}, wantForwardedFor: "192.0.2.1"},
	} {
		t.Run(test.name, func(t *testing.T) {
			h := &httpProxy{
				config: &datasourceHTTP.Config{
					URL:          common.MustParseURL(server.URL),
					AllowHeaders: test.allow,
					DropHeaders:  test.drop,
				},
				path: "/query",
			}
			req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/datasource/query", nil)
			req.RemoteAddr = "192.0.2.1:1234"
			req.Header["Accept"] = []string{"application/json", "text/plain"}
			req.Header.Set("Origin", "https://perses.example.com")
			rec := httptest.NewRecorder()
			require.NoError(t, h.serve(echo.New().NewContext(req, rec)))
			require.Equal(t, http.StatusOK, rec.Code)
			var headers http.Header
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &headers))
			assert.Equal(t, []string{"application/json", "text/plain"}, headers.Values("Accept"))
			assert.Equal(t, test.wantForwardedFor, headers.Get("X-Forwarded-For"))
			if len(test.allow) > 0 || len(test.drop) > 0 {
				assert.NotContains(t, headers, "Origin")
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

func TestHTTPProxy_setupAuthentication_OAuthPassThrough(t *testing.T) {
	testSuite := []struct {
		name          string
		secret        *v1.SecretSpec
		oidcCookie    string
		expectedAuth  string
		expectError   bool
		errorContains string
	}{
		{
			name:         "oauthPassThrough forwards oidc token from cookie",
			secret:       &v1.SecretSpec{OAuthPassThrough: true},
			oidcCookie:   "original-oidc-token",
			expectedAuth: "Bearer original-oidc-token",
		},
		{
			name:          "oauthPassThrough with no oidc cookie returns error",
			secret:        &v1.SecretSpec{OAuthPassThrough: true},
			oidcCookie:    "",
			expectError:   true,
			errorContains: "OAuthPassThrough",
		},
		{
			name:         "oauthPassThrough false does not set auth header",
			secret:       &v1.SecretSpec{OAuthPassThrough: false},
			oidcCookie:   "original-oidc-token",
			expectedAuth: "",
		},
		{
			name:         "nil secret does nothing",
			secret:       nil,
			oidcCookie:   "original-oidc-token",
			expectedAuth: "",
		},
	}

	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			h := &httpProxy{
				secret: test.secret,
			}
			req := httptest.NewRequest(http.MethodGet, "http://example.com", nil)
			if test.oidcCookie != "" {
				req.AddCookie(&http.Cookie{ //nolint:gosec
					Name:  crypto.CookieKeyOIDCToken,
					Value: test.oidcCookie,
				})
			}
			rec := httptest.NewRecorder()
			c := echo.New().NewContext(req, rec)

			err := h.setupAuthentication(c)
			if test.expectError {
				require.Error(t, err)
				assert.Contains(t, err.Error(), test.errorContains)
			} else {
				require.NoError(t, err)
				if test.expectedAuth != "" {
					assert.Equal(t, test.expectedAuth, req.Header.Get(echo.HeaderAuthorization))
				} else {
					assert.Empty(t, req.Header.Get(echo.HeaderAuthorization))
				}
			}
		})
	}
}
