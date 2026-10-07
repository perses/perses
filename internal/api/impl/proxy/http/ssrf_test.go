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

package http

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/impl/proxy/proxytest"
	"github.com/perses/perses/internal/api/netguard"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

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
		h := &Proxy{
			Config: &datasourceHTTP.Config{URL: common.MustParseURL(target)},
			Path:   "/api/v1/projects",
			Guard:  proxytest.NewDefaultGuard(t),
		}
		req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/unsaved/projects/p1/datasources/api/v1/projects", nil)
		rec := httptest.NewRecorder()
		err = h.Serve(echo.New().NewContext(req, rec))
		proxytest.RequireHTTPError(t, err, http.StatusForbidden)
		assert.NotContains(t, rec.Body.String(), "internal data")
	}
	assert.False(t, called, "the internal server must never be reached")
}

// TestHTTPProxy_getToken_deniedTokenURL ensures the OAuth token URL of the secret is verified before requesting a token.
func TestHTTPProxy_getToken_deniedTokenURL(t *testing.T) {
	h := &Proxy{
		Config: &datasourceHTTP.Config{URL: common.MustParseURL("http://prometheus:9090")},
		Path:   "/",
		Guard:  proxytest.NewDefaultGuard(t),
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
	h := &Proxy{
		Config: &datasourceHTTP.Config{URL: common.MustParseURL(server.URL)},
		Path:   "/api/v1/query",
		Guard:  netguard.New(cfg),
		Secret: &v1.SecretSpec{OAuth: &secretModel.OAuth{ //nolint:gosec // G101: test value, not a real credential
			ClientID:     "client",
			ClientSecret: "secret",
			TokenURL:     server.URL + "/token",
		}},
	}

	_, err = h.getToken(context.Background(), h.Secret.OAuth)
	assert.True(t, netguard.IsDenied(err), "expected a denied error, got %v", err)

	req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/globaldatasources/prom/api/v1/query", nil)
	rec := httptest.NewRecorder()
	err = h.Serve(echo.New().NewContext(req, rec))
	proxytest.RequireHTTPError(t, err, http.StatusForbidden)
	assert.False(t, datasourceCalled, "the datasource must not be queried without a token")
}
