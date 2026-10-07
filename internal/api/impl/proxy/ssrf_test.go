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
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/netguard"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
	datasourceSpec "github.com/perses/spec/go/datasource"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
	datasourceSQL "github.com/perses/spec/go/datasource/proxy/sql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// requireHTTPError verifies the HTTP status code the error is translated to by the error middleware.
func requireHTTPError(t *testing.T, err error, code int) {
	t.Helper()
	require.Error(t, err)
	var httpErr *echo.HTTPError
	require.True(t, errors.As(apiinterface.HandleError(err), &httpErr), "expected an error translated to an echo.HTTPError, got %T: %v", err, err)
	assert.Equal(t, code, httpErr.Code)
}

// TestNewProxy_deniedDestination reproduces the reported SSRF: the unsaved proxy endpoints accept the datasource spec in
// the request body, and the saved datasources can point to any URL.
func TestNewProxy_deniedDestination(t *testing.T) {
	for _, test := range []struct {
		title string
		spec  string
	}{
		{
			title: "perses api through loopback",
			spec:  `{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy","spec":{"url":"http://127.0.0.1:8080","secret":"my-secret"}}}}}`,
		},
		{
			title: "cloud metadata endpoint",
			spec:  `{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy","spec":{"url":"http://169.254.169.254/latest/meta-data/","secret":"my-secret"}}}}}`,
		},
		{
			title: "non http scheme",
			spec:  `{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy","spec":{"url":"file:///etc/passwd","secret":"my-secret"}}}}}`,
		},
		{
			title: "sql proxy to loopback",
			spec:  `{"plugin":{"kind":"PostgresDatasource","spec":{"proxy":{"kind":"SQLProxy","spec":{"driver":"postgres","host":"localhost:5432","database":"perses","secret":"my-secret"}}}}}`,
		},
	} {
		t.Run(test.title, func(t *testing.T) {
			var spec datasourceSpec.Spec
			require.NoError(t, json.Unmarshal([]byte(test.spec), &spec))
			retrieveSecret := func(_ string) (*v1.SecretSpec, error) {
				t.Fatal("the secret must not be loaded for a denied destination")
				return nil, nil
			}
			_, err := (&endpoint{guard: newDefaultGuard(t)}).newProxy("unsaved-datasource", "p1", "", spec, "/api/v1/projects", retrieveSecret)
			requireHTTPError(t, err, http.StatusForbidden)
		})
	}
}

func TestNewProxy_allowedDestination(t *testing.T) {
	var spec datasourceSpec.Spec
	require.NoError(t, json.Unmarshal([]byte(`{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy","spec":{"url":"http://prometheus:9090"}}}}}`), &spec))
	pr, err := (&endpoint{guard: newDefaultGuard(t)}).newProxy("prometheus", "p1", "", spec, "api/v1/query", nil)
	require.NoError(t, err)
	h, ok := pr.(*httpProxy)
	require.True(t, ok)
	assert.Equal(t, "/api/v1/query", h.path)
}

func TestNewProxy_allowedByConfiguration(t *testing.T) {
	var spec datasourceSpec.Spec
	require.NoError(t, json.Unmarshal([]byte(`{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy","spec":{"url":"http://localhost:9090"}}}}}`), &spec))
	_, err := (&endpoint{guard: newLoopbackGuard(t)}).newProxy("prometheus", "p1", "", spec, "api/v1/query", nil)
	require.NoError(t, err)
}

// TestHTTPProxy_serve_deniedAtConnectionTime ensures the verification is done on the resolved IP address,
// and not only on the URL: "localhost" is a DNS name resolving to the loopback interface.
func TestHTTPProxy_serve_deniedAtConnectionTime(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		_, _ = w.Write([]byte(`{"secret":"internal data"}`))
	}))
	defer server.Close()
	_, port, err := net.SplitHostPort(strings.TrimPrefix(server.URL, "http://"))
	require.NoError(t, err)

	for _, target := range []string{server.URL, "http://localhost:" + port} {
		h := &httpProxy{
			config: &datasourceHTTP.Config{URL: common.MustParseURL(target)},
			path:   "/api/v1/projects",
			guard:  newDefaultGuard(t),
		}
		req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/unsaved/projects/p1/datasources/api/v1/projects", nil)
		rec := httptest.NewRecorder()
		err = h.serve(echo.New().NewContext(req, rec))
		requireHTTPError(t, err, http.StatusForbidden)
		assert.NotContains(t, rec.Body.String(), "internal data")
	}
	assert.False(t, called, "the internal server must never be reached")
}

// TestHTTPProxy_getToken_deniedTokenURL ensures the OAuth token URL of the secret is verified before requesting a token.
func TestHTTPProxy_getToken_deniedTokenURL(t *testing.T) {
	h := &httpProxy{
		config: &datasourceHTTP.Config{URL: common.MustParseURL("http://prometheus:9090")},
		path:   "/",
		guard:  newDefaultGuard(t),
	}
	_, err := h.getToken(context.Background(), &secretModel.OAuth{ //nolint:gosec // G101: test value, not a real credential
		ClientID:     "client",
		ClientSecret: "secret",
		TokenURL:     "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
	})
	assert.True(t, netguard.IsDenied(err), "expected a denied error, got %v", err)
}

// TestHTTPProxy_serve_tokenURLDeniedAtConnectionTime ensures a connection to the OAuth token URL denied at connection
// time (here, through a redirection) is reported as a denied destination, even though golang.org/x/oauth2 doesn't
// wrap the error of the HTTP client.
func TestHTTPProxy_serve_tokenURLDeniedAtConnectionTime(t *testing.T) {
	datasourceCalled := false
	var redirectTarget string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/token" {
			http.Redirect(w, r, redirectTarget, http.StatusFound)
			return
		}
		datasourceCalled = true
		_, _ = w.Write([]byte("ok"))
	}))
	defer server.Close()
	_, port, err := net.SplitHostPort(server.Listener.Addr().String())
	require.NoError(t, err)
	// 127.0.0.2 is denied: only the address of the test server is allowed.
	redirectTarget = fmt.Sprintf("http://127.0.0.2:%s/token", port)

	cfg := config.DatasourceProxyConfig{AllowedNetworks: []string{"127.0.0.1/32"}}
	require.NoError(t, cfg.Verify())
	h := &httpProxy{
		config: &datasourceHTTP.Config{URL: common.MustParseURL(server.URL)},
		path:   "/api/v1/query",
		guard:  netguard.New(cfg),
		secret: &v1.SecretSpec{OAuth: &secretModel.OAuth{ //nolint:gosec // G101: test value, not a real credential
			ClientID:     "client",
			ClientSecret: "secret",
			TokenURL:     server.URL + "/token",
		}},
	}

	_, err = h.getToken(context.Background(), h.secret.OAuth)
	assert.True(t, netguard.IsDenied(err), "expected a denied error, got %v", err)

	req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/globaldatasources/prom/api/v1/query", nil)
	rec := httptest.NewRecorder()
	err = h.serve(echo.New().NewContext(req, rec))
	requireHTTPError(t, err, http.StatusForbidden)
	assert.False(t, datasourceCalled, "the datasource must not be queried without a token")
}

// TestSQLProxy_postgres_allowedHosts ensures the allowed hosts work with Postgres: pgx resolves the hostname itself and
// dials the resolved IP addresses, so the allowed hosts must be verified on the hostname and not on the IP addresses.
func TestSQLProxy_postgres_allowedHosts(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	defer func() { _ = listener.Close() }()
	accepted := make(chan struct{}, 10)
	go func() {
		for {
			conn, acceptErr := listener.Accept()
			if acceptErr != nil {
				return
			}
			accepted <- struct{}{}
			_ = conn.Close()
		}
	}()
	_, port, err := net.SplitHostPort(listener.Addr().String())
	require.NoError(t, err)

	newGuard := func(allowedHosts ...string) *netguard.Guard {
		cfg := config.DatasourceProxyConfig{AllowedHosts: allowedHosts, AllowedNetworks: []string{"127.0.0.0/8", "::1/128"}}
		require.NoError(t, cfg.Verify())
		return netguard.New(cfg)
	}
	ping := func(guard *netguard.Guard) error {
		s := &sqlProxy{
			config: &datasourceSQL.Config{Driver: datasourceSQL.DriverPostgreSQL, Host: "localhost:" + port, Database: "perses",
				Postgres: &datasourceSQL.PostgresConfig{SSLMode: datasourceSQL.SSLModeDisable}},
			guard: guard,
		}
		db, openErr := s.sqlOpen(nil)
		require.NoError(t, openErr)
		defer func() { _ = db.Close() }()
		return db.PingContext(context.Background())
	}

	// The fake server closes the connection: the ping fails, but the connection has been established.
	err = ping(newGuard("localhost"))
	assert.Error(t, err)
	assert.False(t, netguard.IsDenied(err), "expected the connection to be allowed, got %v", err)
	select {
	case <-accepted:
	default:
		t.Fatal("the connection to the database should have been established")
	}

	err = ping(newGuard("db.example.com"))
	assert.True(t, netguard.IsDenied(err), "expected a denied error, got %v", err)
}

func TestSQLProxy_deniedDestination(t *testing.T) {
	for _, test := range []struct {
		title string
		proxy *sqlProxy
	}{
		{
			title: "postgres",
			proxy: &sqlProxy{config: &datasourceSQL.Config{Driver: datasourceSQL.DriverPostgreSQL, Host: "127.0.0.1:5432", Database: "perses"}, guard: newDefaultGuard(t)},
		},
		{
			title: "postgres through a hostname",
			proxy: &sqlProxy{config: &datasourceSQL.Config{Driver: datasourceSQL.DriverPostgreSQL, Host: "localhost:5432", Database: "perses"}, guard: newDefaultGuard(t)},
		},
		{
			title: "mysql",
			proxy: &sqlProxy{config: &datasourceSQL.Config{Driver: datasourceSQL.DriverMySQL, Host: "127.0.0.1:3306", Database: "perses"}, guard: newDefaultGuard(t)},
		},
	} {
		t.Run(test.title, func(t *testing.T) {
			db, err := test.proxy.sqlOpen(nil)
			require.NoError(t, err)
			defer func() { _ = db.Close() }()
			err = db.PingContext(context.Background())
			assert.True(t, netguard.IsDenied(err), "expected a denied error, got %v", err)
		})
	}
}

// TestSQLProxy_buildMySQLConfig_dialThroughGuard ensures every connection to the database goes through the guard.
// The Postgres equivalent is covered by TestSQLProxy_deniedDestination.
func TestSQLProxy_buildMySQLConfig_dialThroughGuard(t *testing.T) {
	s := &sqlProxy{config: &datasourceSQL.Config{Driver: datasourceSQL.DriverMySQL, Host: "mysql:3306", Database: "perses"}, guard: newDefaultGuard(t)}
	cfg, err := s.buildMySQLConfig(nil)
	require.NoError(t, err)
	assert.NotNil(t, cfg.DialFunc)
}
