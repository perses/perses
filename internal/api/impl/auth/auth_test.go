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
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/perses/perses/internal/api/utils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"
)

func TestGetRedirectURI_WithAPIPrefix(t *testing.T) {
	cases := []struct {
		title     string
		apiPrefix string
		want      string
	}{
		{"empty prefix", "", "http://localhost:8080/api/auth/providers/oidc/azure/callback"},
		{"perses", "perses", "http://localhost:8080/perses/api/auth/providers/oidc/azure/callback"},
		{"/perses", "/perses", "http://localhost:8080/perses/api/auth/providers/oidc/azure/callback"},
		// Double slashes are not removed, but it's ok as the apiPrefix supposed to be used as is.
		{"perses/", "perses/", "http://localhost:8080/perses//api/auth/providers/oidc/azure/callback"},
	}
	for _, tc := range cases {
		t.Run(tc.title, func(t *testing.T) {
			got := getRedirectURI(&http.Request{
				URL: &url.URL{
					Scheme: "http",
				},
				Host: "localhost:8080",
			}, utils.AuthnKindOIDC, "azure", tc.apiPrefix)
			assert.Equal(t, tc.want, got)
		})
	}
}

// Test for encodeOAuthState: ensures the state is correctly formatted and contains the redirect path.
func TestEncodeOAuthState(t *testing.T) {
	redirect := "/dashboard"
	state := encodeOAuthState(redirect)
	assert.Contains(t, state, "--/dashboard")
	assert.Len(t, state, 16+2+10)
}

// Test for decodeOAuthState: ensures correct extraction and empty string for invalid formats.
func TestDecodeOAuthState(t *testing.T) {
	redirect := "/dashboard"
	state := "1234567890abcdef--" + redirect
	assert.Equal(t, redirect, decodeOAuthState(state))

	state = "invalidformat"
	assert.Equal(t, "", decodeOAuthState(state))

	state = "short--"
	assert.Equal(t, "", decodeOAuthState(state))
}

// TestOAuthRetrieveDeviceAccessToken_UsesProviderHTTPClient ensures the device code token
// exchange goes through the provider-scoped http client (which carries the configured TLS
// and timeout) rather than http.DefaultClient. The server is served over TLS with a test
// certificate that only the provider client trusts, so the exchange can only succeed when
// e.httpClient is used.
func TestOAuthRetrieveDeviceAccessToken_UsesProviderHTTPClient(t *testing.T) {
	const deviceCode = "device-code-123"
	var gotGrantType, gotDeviceCode string
	srv := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.NoError(t, r.ParseForm())
		gotGrantType = r.PostForm.Get("grant_type")
		gotDeviceCode = r.PostForm.Get("device_code")
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"an-access-token","token_type":"Bearer"}`))
	}))
	defer srv.Close()

	e := &oAuthEndpoint{
		// srv.Client() trusts the server's test certificate, unlike http.DefaultClient.
		httpClient: srv.Client(),
		deviceCodeConf: oauth2.Config{
			Endpoint: oauth2.Endpoint{TokenURL: srv.URL},
		},
	}

	token, err := e.retrieveDeviceAccessToken(context.Background(), deviceCode)
	require.NoError(t, err)
	assert.Equal(t, "an-access-token", token.AccessToken)
	assert.Equal(t, "urn:ietf:params:oauth:grant-type:device_code", gotGrantType)
	assert.Equal(t, deviceCode, gotDeviceCode)
}
