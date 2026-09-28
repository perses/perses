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
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/netguard"
	v1 "github.com/perses/perses/pkg/model/api/v1"
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
			_, err := (&endpoint{}).newProxy("unsaved-datasource", "p1", "", spec, "/api/v1/projects", retrieveSecret)
			requireHTTPError(t, err, http.StatusForbidden)
		})
	}
}

func TestNewProxy_allowedDestination(t *testing.T) {
	var spec datasourceSpec.Spec
	require.NoError(t, json.Unmarshal([]byte(`{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy","spec":{"url":"http://prometheus:9090"}}}}}`), &spec))
	pr, err := (&endpoint{}).newProxy("prometheus", "p1", "", spec, "api/v1/query", nil)
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
		}
		req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/unsaved/projects/p1/datasources/api/v1/projects", nil)
		rec := httptest.NewRecorder()
		err = h.serve(echo.New().NewContext(req, rec))
		requireHTTPError(t, err, http.StatusForbidden)
		assert.NotContains(t, rec.Body.String(), "internal data")
	}
	assert.False(t, called, "the internal server must never be reached")
}

func TestHTTPProxy_serve_sanitizeRedirection(t *testing.T) {
	var location string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Location", location)
		w.WriteHeader(http.StatusFound)
	}))
	defer server.Close()
	serverURL, err := url.Parse(server.URL)
	require.NoError(t, err)

	for _, test := range []struct {
		location string
		kept     bool
	}{
		{location: "/graph", kept: true},
		{location: "graph", kept: true},
		{location: server.URL + "/graph", kept: true},
		{location: "//" + serverURL.Host + "/graph", kept: true},
		{location: "https://evil.example.com/login"},
		{location: "//evil.example.com/login"},
		{location: "///evil.example.com/login"},
		{location: "/\\evil.example.com/login"},
		{location: " \t//evil.example.com"},
		{location: "https://" + serverURL.Host + "/graph"},
	} {
		t.Run(test.location, func(t *testing.T) {
			location = test.location
			h := &httpProxy{
				config: &datasourceHTTP.Config{URL: common.MustParseURL(server.URL)},
				path:   "/",
				guard:  newLoopbackGuard(t),
			}
			req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/globaldatasources/prom/", nil)
			rec := httptest.NewRecorder()
			require.NoError(t, h.serve(echo.New().NewContext(req, rec)))
			assert.Equal(t, http.StatusFound, rec.Code)
			if test.kept {
				assert.Equal(t, test.location, rec.Header().Get("Location"))
			} else {
				assert.Empty(t, rec.Header().Get("Location"))
			}
		})
	}
}

func TestSQLProxy_deniedDestination(t *testing.T) {
	for _, test := range []struct {
		title string
		proxy *sqlProxy
	}{
		{
			title: "postgres",
			proxy: &sqlProxy{config: &datasourceSQL.Config{Driver: datasourceSQL.DriverPostgreSQL, Host: "127.0.0.1:5432", Database: "perses"}},
		},
		{
			title: "postgres through a hostname",
			proxy: &sqlProxy{config: &datasourceSQL.Config{Driver: datasourceSQL.DriverPostgreSQL, Host: "localhost:5432", Database: "perses"}},
		},
		{
			title: "mysql",
			proxy: &sqlProxy{config: &datasourceSQL.Config{Driver: datasourceSQL.DriverMySQL, Host: "127.0.0.1:3306", Database: "perses"}},
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
	s := &sqlProxy{config: &datasourceSQL.Config{Driver: datasourceSQL.DriverMySQL, Host: "mysql:3306", Database: "perses"}}
	cfg, err := s.buildMySQLConfig(nil)
	require.NoError(t, err)
	assert.NotNil(t, cfg.DialFunc)
}
