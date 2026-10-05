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
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/zitadel/oidc/v3/pkg/client/rp"
	"golang.org/x/oauth2"
)

const (
	testOldRefreshToken = "old-refresh-token"
	testNewAccessToken  = "new-access-token"
	testNewRefreshToken = "new-refresh-token"
)

func ptr[T any](v T) *T {
	return &v
}

func newTestJWT(t *testing.T) crypto.JWT {
	t.Helper()
	_, jwt, err := crypto.New(config.Security{
		// 32 bytes hex-encoded key
		EncryptionKey: secret.Hidden("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"),
		Authentication: config.AuthenticationConfig{
			AccessTokenTTL:  common.Duration(config.DefaultAccessTokenTTL),
			RefreshTokenTTL: common.Duration(config.DefaultRefreshTokenTTL),
		},
	})
	require.NoError(t, err)
	return jwt
}

// newTestTokenServer starts a fake OAuth/OIDC provider token endpoint handling the refresh_token grant.
// When failRefresh is true, it answers with an "invalid_grant" error.
// When rotateRefreshToken is true, it issues a new refresh token along with the new access token.
func newTestTokenServer(t *testing.T, failRefresh, rotateRefreshToken bool, calls *atomic.Int32) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		assert.NoError(t, r.ParseForm())
		assert.Equal(t, "refresh_token", r.PostForm.Get("grant_type"))
		assert.Equal(t, testOldRefreshToken, r.PostForm.Get("refresh_token"))
		w.Header().Set("Content-Type", "application/json")
		if failRefresh {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error":"invalid_grant","error_description":"refresh token expired"}`))
			return
		}
		body := `{"access_token":"` + testNewAccessToken + `","token_type":"Bearer","expires_in":3600`
		if rotateRefreshToken {
			body += `,"refresh_token":"` + testNewRefreshToken + `"`
		}
		body += `}`
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(srv.Close)
	return srv
}

func newTestOAuthRefresher(t *testing.T, srv *httptest.Server, jwt crypto.JWT) crypto.TokenRefresher {
	t.Helper()
	e := &oAuthEndpoint{
		conf: oauth2.Config{
			ClientID:     "client-id",
			ClientSecret: "client-secret",
			Endpoint:     oauth2.Endpoint{TokenURL: srv.URL},
		},
		httpClient:      srv.Client(),
		jwt:             jwt,
		tokenManagement: tokenManagement{jwt: jwt},
		slugID:          "test-oauth",
	}
	return e.RefreshOIDCToken
}

func newTestOIDCRefresher(t *testing.T, srv *httptest.Server, jwt crypto.JWT) crypto.TokenRefresher {
	t.Helper()
	relyingParty, err := rp.NewRelyingPartyOAuth(&oauth2.Config{
		ClientID:     "client-id",
		ClientSecret: "client-secret",
		Endpoint:     oauth2.Endpoint{TokenURL: srv.URL},
	}, rp.WithHTTPClient(srv.Client()))
	require.NoError(t, err)
	e := &oIDCEndpoint{
		relyingParty:    &RelyingPartyWithTokenEndpoint{RelyingParty: relyingParty},
		jwt:             jwt,
		tokenManagement: tokenManagement{jwt: jwt},
		slugID:          "test-oidc",
	}
	return e.RefreshOIDCToken
}

func TestRefreshOIDCToken(t *testing.T) {
	refresherBuilders := map[string]func(t *testing.T, srv *httptest.Server, jwt crypto.JWT) crypto.TokenRefresher{
		"oauth": newTestOAuthRefresher,
		"oidc":  newTestOIDCRefresher,
	}

	testSuite := []struct {
		title string
		// refreshTokenCookie is the value of the OIDC refresh token cookie sent with the request. A nil value means no cookie.
		refreshTokenCookie *string
		failRefresh        bool
		rotateRefreshToken bool
		expectedToken      string
		// expectProviderCall tells whether the provider token endpoint should be called.
		// (The number of calls is not checked as the oauth2 lib may retry with another auth style on failure.)
		expectProviderCall bool
		// expectedCookies maps the cookie name to the expected value. A nil map means no cookie should be set.
		expectedCookies map[string]string
		// expectedDeletedCookies is the list of cookies that should be deleted (MaxAge < 0).
		expectedDeletedCookies []string
	}{
		{
			title:         "no refresh token cookie: nothing to refresh",
			expectedToken: "",
		},
		{
			title:              "empty refresh token cookie: nothing to refresh",
			refreshTokenCookie: ptr(""),
			expectedToken:      "",
		},
		{
			title:              "successful refresh with refresh token rotation",
			refreshTokenCookie: ptr(testOldRefreshToken),
			rotateRefreshToken: true,
			expectedToken:      testNewAccessToken,
			expectProviderCall: true,
			expectedCookies: map[string]string{
				crypto.CookieKeyOIDCToken:        testNewAccessToken,
				crypto.CookieKeyOIDCRefreshToken: testNewRefreshToken,
			},
		},
		{
			title:              "successful refresh without refresh token rotation",
			refreshTokenCookie: ptr(testOldRefreshToken),
			expectedToken:      testNewAccessToken,
			expectProviderCall: true,
			expectedCookies: map[string]string{
				crypto.CookieKeyOIDCToken: testNewAccessToken,
			},
		},
		{
			title:                  "provider rejects the refresh token: OIDC cookies are cleared",
			refreshTokenCookie:     ptr(testOldRefreshToken),
			failRefresh:            true,
			expectedToken:          "",
			expectProviderCall:     true,
			expectedDeletedCookies: []string{crypto.CookieKeyOIDCToken, crypto.CookieKeyOIDCRefreshToken},
		},
	}

	jwt := newTestJWT(t)
	for kind, buildRefresher := range refresherBuilders {
		for _, test := range testSuite {
			t.Run(kind+"/"+test.title, func(t *testing.T) {
				var calls atomic.Int32
				srv := newTestTokenServer(t, test.failRefresh, test.rotateRefreshToken, &calls)
				refresher := buildRefresher(t, srv, jwt)

				req := httptest.NewRequest(http.MethodGet, "/proxy", nil)
				if test.refreshTokenCookie != nil {
					req.AddCookie(&http.Cookie{Name: crypto.CookieKeyOIDCRefreshToken, Value: *test.refreshTokenCookie}) //nolint:gosec // request cookie in test, security attributes are irrelevant
				}
				rec := httptest.NewRecorder()
				ctx := echo.New().NewContext(req, rec)

				token := refresher(ctx)

				assert.Equal(t, test.expectedToken, token)
				assert.Equal(t, test.expectProviderCall, calls.Load() > 0)

				responseCookies := rec.Result().Cookies()
				cookiesByName := make(map[string]*http.Cookie, len(responseCookies))
				for _, c := range responseCookies {
					cookiesByName[c.Name] = c
				}

				for _, name := range test.expectedDeletedCookies {
					c, ok := cookiesByName[name]
					if assert.Truef(t, ok, "cookie %q should be deleted", name) {
						assert.Empty(t, c.Value)
						assert.Less(t, c.MaxAge, 0)
					}
					delete(cookiesByName, name)
				}

				for name, expectedValue := range test.expectedCookies {
					c, ok := cookiesByName[name]
					if assert.Truef(t, ok, "cookie %q should be set", name) {
						assert.Equal(t, expectedValue, c.Value)
						assert.Greater(t, c.MaxAge, 0)
						assert.True(t, c.Expires.After(time.Now()))
					}
					delete(cookiesByName, name)
				}

				assert.Empty(t, cookiesByName, "no other cookie should be set")
			})
		}
	}
}
