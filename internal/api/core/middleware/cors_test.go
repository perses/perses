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

package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v5"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newCORSServer(t *testing.T, conf config.CORSConfig) *echo.Echo {
	t.Helper()
	conf.Enable = true
	require.NoError(t, conf.Verify())
	e := echo.New()
	e.Use(CORS(conf))
	e.GET("/api/v1/projects", func(c *echo.Context) error {
		return c.NoContent(http.StatusOK)
	})
	return e
}

func TestCORS_AllowedOrigin(t *testing.T) {
	tests := []struct {
		name           string
		allowOrigins   []string
		origin         string
		expectedOrigin string
	}{
		{
			name:           "every origin is allowed by default",
			origin:         "https://app.example.com",
			expectedOrigin: "*",
		},
		{
			name:           "wildcard",
			allowOrigins:   []string{"*"},
			origin:         "https://app.example.com",
			expectedOrigin: "*",
		},
		{
			name:           "exact origin",
			allowOrigins:   []string{"https://perses.dev", "https://app.example.com"},
			origin:         "https://app.example.com",
			expectedOrigin: "https://app.example.com",
		},
		{
			name:         "origin not allowed",
			allowOrigins: []string{"https://app.example.com"},
			origin:       "https://other.example.com",
		},
		{
			name:         "the exact origins are case-sensitive",
			allowOrigins: []string{"https://app.example.com"},
			origin:       "https://APP.example.com",
		},
		{
			name:         "the scheme must match",
			allowOrigins: []string{"https://app.example.com"},
			origin:       "http://app.example.com",
		},
		// The wildcard patterns below are deprecated (https://github.com/perses/perses/issues/4721).
		{
			name:           "'*' pattern on a subdomain",
			allowOrigins:   []string{"https://*.example.com"},
			origin:         "https://team-a.example.com",
			expectedOrigin: "https://team-a.example.com",
		},
		{
			name:           "'*' pattern also matches the nested subdomains",
			allowOrigins:   []string{"https://*.example.com"},
			origin:         "https://a.b.example.com",
			expectedOrigin: "https://a.b.example.com",
		},
		{
			name:         "'*' pattern on a subdomain doesn't match the parent domain",
			allowOrigins: []string{"https://*.example.com"},
			origin:       "https://example.com",
		},
		{
			name:         "'*' pattern on a subdomain doesn't match another scheme",
			allowOrigins: []string{"https://*.example.com"},
			origin:       "http://team-a.example.com",
		},
		{
			// This is one of the reasons why the patterns are deprecated.
			name:           "'*' pattern without a dot matches another domain",
			allowOrigins:   []string{"https://*example.com"},
			origin:         "https://evilexample.com",
			expectedOrigin: "https://evilexample.com",
		},
		{
			name:           "'?' pattern",
			allowOrigins:   []string{"https://app?.example.com"},
			origin:         "https://app1.example.com",
			expectedOrigin: "https://app1.example.com",
		},
		{
			name:         "'?' pattern matches exactly one character",
			allowOrigins: []string{"https://app?.example.com"},
			origin:       "https://app12.example.com",
		},
		{
			name:           "'*' pattern on the port",
			allowOrigins:   []string{"http://localhost:*"},
			origin:         "http://localhost:3000",
			expectedOrigin: "http://localhost:3000",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := newCORSServer(t, config.CORSConfig{AllowOrigins: tt.allowOrigins})
			req := httptest.NewRequest(http.MethodGet, "/api/v1/projects", nil)
			req.Header.Set(echo.HeaderOrigin, tt.origin)
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)
			assert.Equal(t, http.StatusOK, rec.Code)
			assert.Equal(t, tt.expectedOrigin, rec.Header().Get(echo.HeaderAccessControlAllowOrigin))
		})
	}
}

func TestCORS_DefaultOriginWithoutVerifiedConfig(t *testing.T) {
	// The middleware doesn't rely on the default set when the configuration is verified.
	e := echo.New()
	e.Use(CORS(config.CORSConfig{Enable: true}))
	e.GET("/api/v1/projects", func(c *echo.Context) error {
		return c.NoContent(http.StatusOK)
	})
	req := httptest.NewRequest(http.MethodGet, "/api/v1/projects", nil)
	req.Header.Set(echo.HeaderOrigin, "https://app.example.com")
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)
	assert.Equal(t, "*", rec.Header().Get(echo.HeaderAccessControlAllowOrigin))
}

func TestCORS_Credentials(t *testing.T) {
	e := newCORSServer(t, config.CORSConfig{
		AllowOrigins:     []string{"https://*.example.com"},
		AllowCredentials: true,
		ExposeHeaders:    []string{"Content-Encoding"},
	})
	req := httptest.NewRequest(http.MethodGet, "/api/v1/projects", nil)
	req.Header.Set(echo.HeaderOrigin, "https://app.example.com")
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)
	assert.Equal(t, "https://app.example.com", rec.Header().Get(echo.HeaderAccessControlAllowOrigin))
	assert.Equal(t, "true", rec.Header().Get(echo.HeaderAccessControlAllowCredentials))
	assert.Equal(t, "Content-Encoding", rec.Header().Get(echo.HeaderAccessControlExposeHeaders))
}

func TestCORS_Preflight(t *testing.T) {
	e := newCORSServer(t, config.CORSConfig{
		AllowOrigins: []string{"https://app.example.com"},
		AllowMethods: []string{http.MethodGet, http.MethodPost},
		AllowHeaders: []string{"X-Custom-Header"},
		MaxAge:       60,
	})
	tests := []struct {
		name           string
		origin         string
		expectedOrigin string
	}{
		{
			name:           "allowed origin",
			origin:         "https://app.example.com",
			expectedOrigin: "https://app.example.com",
		},
		{
			name:   "origin not allowed",
			origin: "https://other.example.com",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodOptions, "/api/v1/projects", nil)
			req.Header.Set(echo.HeaderOrigin, tt.origin)
			req.Header.Set(echo.HeaderAccessControlRequestMethod, http.MethodPost)
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)
			assert.Equal(t, http.StatusNoContent, rec.Code)
			assert.Equal(t, tt.expectedOrigin, rec.Header().Get(echo.HeaderAccessControlAllowOrigin))
			if tt.expectedOrigin == "" {
				return
			}
			assert.Equal(t, "GET,POST", rec.Header().Get(echo.HeaderAccessControlAllowMethods))
			assert.Equal(t, "X-Custom-Header", rec.Header().Get(echo.HeaderAccessControlAllowHeaders))
			assert.Equal(t, "60", rec.Header().Get(echo.HeaderAccessControlMaxAge))
		})
	}
}
