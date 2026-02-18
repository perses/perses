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

package auth

import (
	"context"
	"crypto/tls"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/go-jose/go-jose/v4"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/zitadel/oidc/v3/pkg/client/rp"
	httphelper "github.com/zitadel/oidc/v3/pkg/http"
	"golang.org/x/oauth2"
)

func TestGetRootURL(t *testing.T) {
	tests := []struct {
		name            string
		host            string
		scheme          string
		xForwardedHost  string
		xForwardedProto string
		hasTLS          bool
		expectedURL     string
	}{
		{
			name:        "basic http request",
			host:        "localhost:8080",
			scheme:      "http",
			expectedURL: "http://localhost:8080",
		},
		{
			name:        "https request with TLS",
			host:        "perses.example.com",
			scheme:      "https",
			hasTLS:      true,
			expectedURL: "https://perses.example.com",
		},
		{
			name:           "behind proxy with X-Forwarded-Host",
			host:           "internal:8080",
			scheme:         "http",
			xForwardedHost: "public.example.com",
			expectedURL:    "http://public.example.com",
		},
		{
			name:            "behind proxy with X-Forwarded-Proto",
			host:            "localhost:8080",
			scheme:          "http",
			xForwardedProto: "https",
			expectedURL:     "https://localhost:8080",
		},
		{
			name:            "behind proxy with both X-Forwarded headers",
			host:            "internal:8080",
			scheme:          "http",
			xForwardedHost:  "public.example.com",
			xForwardedProto: "https",
			expectedURL:     "https://public.example.com",
		},
		{
			name:        "no trailing slash on plain domain",
			host:        "example.com",
			scheme:      "https",
			hasTLS:      true,
			expectedURL: "https://example.com",
		},
		{
			name:        "no trailing slash with port",
			host:        "example.com:443",
			scheme:      "https",
			hasTLS:      true,
			expectedURL: "https://example.com:443",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			req.Host = tt.host
			if tt.xForwardedHost != "" {
				req.Header.Set("X-Forwarded-Host", tt.xForwardedHost)
			}
			if tt.xForwardedProto != "" {
				req.Header.Set("X-Forwarded-Proto", tt.xForwardedProto)
			}
			if tt.hasTLS {
				req.TLS = &tls.ConnectionState{} // Just need non-nil value
			}

			rootURL := getRootURL(req, "")

			assert.Equal(t, tt.expectedURL, rootURL.String())
		})
	}
}

func TestNewOIDCExtraLogoutHandler(t *testing.T) {
	tests := []struct {
		name                    string
		endSessionEndpoint      string
		logoutEnabled           bool
		logoutRedirectParamName string
		clientID                string
		host                    string
		scheme                  string
		hasTLS                  bool
		expectedQueryParams     map[string]string
		expectNilHandler        bool
	}{
		{
			name:               "logout disabled - no handler",
			endSessionEndpoint: "https://provider.example.com/logout",
			logoutEnabled:      false,
			clientID:           "client123",
			expectNilHandler:   true,
		},
		{
			name:               "logout enabled with standard endpoint - default param name",
			endSessionEndpoint: "https://provider.example.com/logout",
			logoutEnabled:      true,
			clientID:           "client123",
			host:               "localhost:8080",
			scheme:             "http",
			expectedQueryParams: map[string]string{
				"post_logout_redirect_uri": "http://localhost:8080",
				"client_id":                "client123",
			},
		},
		{
			name:                    "logout enabled with cognito - custom param name",
			endSessionEndpoint:      "https://cognito.amazonaws.com/logout",
			logoutEnabled:           true,
			logoutRedirectParamName: "logout_uri",
			clientID:                "cognito-client",
			host:                    "app.example.com",
			scheme:                  "https",
			hasTLS:                  true,
			expectedQueryParams: map[string]string{
				"logout_uri": "https://app.example.com",
				"client_id":  "cognito-client",
			},
		},
		{
			name:               "logout with existing query params - default param name",
			endSessionEndpoint: "https://provider.example.com/logout?existing=param",
			logoutEnabled:      true,
			clientID:           "client456",
			host:               "test.local",
			scheme:             "http",
			expectedQueryParams: map[string]string{
				"post_logout_redirect_uri": "http://test.local",
				"client_id":                "client456",
				"existing":                 "param",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider := config.OIDCProvider{
				Logout: config.OIDCLogout{
					Enabled:                 tt.logoutEnabled,
					LogoutRedirectParamName: tt.logoutRedirectParamName,
				},
			}

			mockRP := &mockRelyingPartyWrapper{
				endSessionEndpoint: tt.endSessionEndpoint,
				clientID:           tt.clientID,
			}
			rp := &RelyingPartyWithTokenEndpoint{RelyingParty: mockRP}

			handler, err := newOIDCExtraLogoutHandler(provider, rp, "")
			require.NoError(t, err)

			if tt.expectNilHandler {
				assert.Nil(t, handler)
				return
			}

			require.NotNil(t, handler)

			// Test the handler
			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, "/logout", nil)
			req.Host = tt.host
			if tt.hasTLS {
				req.TLS = &tls.ConnectionState{}
			}
			rec := httptest.NewRecorder()
			ctx := e.NewContext(req, rec)

			err = handler(ctx)
			require.NoError(t, err)

			// Verify redirect
			assert.Equal(t, http.StatusFound, rec.Code)
			location := rec.Header().Get("Location")
			assert.NotEmpty(t, location)

			// Parse and verify query parameters
			parsedURL, err := url.Parse(location)
			require.NoError(t, err)

			query := parsedURL.Query()
			for key, expectedValue := range tt.expectedQueryParams {
				assert.Equal(t, expectedValue, query.Get(key), "Query param %s should match", key)
			}
		})
	}
}

func TestOIDCExtraLogoutHandler(t *testing.T) {
	tests := []struct {
		name                   string
		logoutEnabled          bool
		endSessionEndpoint     string
		expectedStatusCode     int
		expectedLocationPrefix string
		expectNilHandler       bool
	}{
		{
			name:             "logout disabled - no handler created",
			logoutEnabled:    false,
			expectNilHandler: true,
		},
		{
			name:               "logout enabled but no end_session_endpoint - handler fails to parse",
			logoutEnabled:      true,
			endSessionEndpoint: "",
			// With empty endpoint, url.Parse will succeed but return empty URL
			// The handler will still be created and will redirect to an empty/invalid URL
			expectedStatusCode:     http.StatusFound,
			expectedLocationPrefix: "?",
		},
		{
			name:                   "logout enabled with end_session_endpoint - redirect to provider",
			logoutEnabled:          true,
			endSessionEndpoint:     "https://provider.example.com/logout",
			expectedStatusCode:     http.StatusFound,
			expectedLocationPrefix: "https://provider.example.com/logout",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider := config.OIDCProvider{
				Logout: config.OIDCLogout{
					Enabled: tt.logoutEnabled,
				},
			}

			mockRP := &mockRelyingPartyWrapper{
				endSessionEndpoint: tt.endSessionEndpoint,
				clientID:           "test-client",
			}
			rp := &RelyingPartyWithTokenEndpoint{RelyingParty: mockRP}

			handler, err := newOIDCExtraLogoutHandler(provider, rp, "")
			require.NoError(t, err)

			if tt.expectNilHandler {
				assert.Nil(t, handler)
				return
			}

			require.NotNil(t, handler)

			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, "/logout", nil)
			req.Host = "localhost:8080"
			rec := httptest.NewRecorder()
			ctx := e.NewContext(req, rec)

			err = handler(ctx)

			require.NoError(t, err)
			assert.Equal(t, tt.expectedStatusCode, rec.Code)

			location := rec.Header().Get("Location")
			assert.NotEmpty(t, location)
			assert.Contains(t, location, tt.expectedLocationPrefix)
		})
	}
}

// mockRelyingPartyWrapper is a minimal mock that implements rp.RelyingParty for testing
type mockRelyingPartyWrapper struct {
	endSessionEndpoint string
	clientID           string
}

func (m *mockRelyingPartyWrapper) GetEndSessionEndpoint() string {
	return m.endSessionEndpoint
}

func (m *mockRelyingPartyWrapper) OAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID: m.clientID,
	}
}

// Minimal implementations for required rp.RelyingParty interface methods
func (m *mockRelyingPartyWrapper) Issuer() string                                  { return "" }
func (m *mockRelyingPartyWrapper) IsPKCE() bool                                    { return false }
func (m *mockRelyingPartyWrapper) IsOAuth2Only() bool                              { return false }
func (m *mockRelyingPartyWrapper) CookieHandler() *httphelper.CookieHandler        { return nil }
func (m *mockRelyingPartyWrapper) HttpClient() *http.Client                        { return nil }
func (m *mockRelyingPartyWrapper) GetDeviceAuthorizationEndpoint() string          { return "" }
func (m *mockRelyingPartyWrapper) GetRevokeEndpoint() string                       { return "" }
func (m *mockRelyingPartyWrapper) UserinfoEndpoint() string                        { return "" }
func (m *mockRelyingPartyWrapper) IDTokenVerifier() *rp.IDTokenVerifier            { return nil }
func (m *mockRelyingPartyWrapper) Signer() jose.Signer                             { return nil }
func (m *mockRelyingPartyWrapper) Logger(ctx context.Context) (*slog.Logger, bool) { return nil, false }
func (m *mockRelyingPartyWrapper) ErrorHandler() func(w http.ResponseWriter, r *http.Request, errorType string, errorDesc string, state string) {
	return nil
}
