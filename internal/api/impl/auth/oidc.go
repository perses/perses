// Copyright 2023 The Perses Authors
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
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/securecookie"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	"github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
	"github.com/zitadel/oidc/v3/pkg/client/rp"
	httphelper "github.com/zitadel/oidc/v3/pkg/http"
	"github.com/zitadel/oidc/v3/pkg/oidc"
)

// oidcUserInfo implements externalUserInfo for the OIDC providers
type oidcUserInfo struct {
	externalUserInfoProfile
	Subject string `json:"sub,omitempty"`
	// issuer is not supposed to be taken from json, but instead it must be set right before the db sync.
	issuer string
}

// GetSubject implements [rp.SubjectGetter]
func (u *oidcUserInfo) GetSubject() string {
	return u.Subject
}

// GetLogin implements [externalUserInfo]
// It uses the first part of the email to create the username.
func (u *oidcUserInfo) GetLogin() string {
	return buildLoginFromEmail(u.Email)
}

// GetProfile implements [externalUserInfo]
func (u *oidcUserInfo) GetProfile() externalUserInfoProfile {
	return u.externalUserInfoProfile
}

// GetProviderContext implements [externalUserInfo]
func (u *oidcUserInfo) GetProviderContext() v1.OAuthProvider {
	return v1.OAuthProvider{
		Issuer:  u.issuer,
		Email:   u.Email,
		Subject: u.Subject,
	}
}

type oIDCEndpoint struct {
	relyingParty    rp.RelyingParty
	jwt             crypto.JWT
	tokenManagement tokenManagement
	slugID          string
	urlParams       map[string]string
	issuer          string
	svc             service
}

func newOIDCEndpoint(provider config.OIDCProvider, jwt crypto.JWT, dao user.DAO) (route.Endpoint, error) {
	issuer := provider.Issuer.String()
	redirectURI := ""
	if !provider.RedirectURI.IsNilOrEmpty() {
		redirectURI = provider.RedirectURI.String()
	}
	// As the cookie is used only at login time, we don't need a persistent value here.
	// The OIDC library will use it this way:
	// - Right before calling the /authorize provider's endpoint, it set "state" in a cookie and the "PKCE code challenge" in another
	// - Then it redirects to /authorize provider's endpoint that redirects back to our /callback endpoint
	// - Before calling the /token, the OIDC library will then take the "state" and "PKCE code challenge"
	//   from cookie to use them before deleting the cookies.
	key := securecookie.GenerateRandomKey(16)
	cookieHandler := httphelper.NewCookieHandler(key, key)
	client := &http.Client{
		Timeout: time.Minute,
	}
	options := []rp.Option{
		rp.WithVerifierOpts(rp.WithIssuedAtOffset(5 * time.Second)),
		rp.WithHTTPClient(client),
		rp.WithCookieHandler(cookieHandler),
	}
	if !provider.DisablePKCE {
		options = append(options, rp.WithPKCE(cookieHandler))
	}
	if !provider.DiscoveryURL.IsNilOrEmpty() {
		options = append(options, rp.WithCustomDiscoveryUrl(provider.DiscoveryURL.String()))
	}
	relyingParty, err := rp.NewRelyingPartyOIDC(
		context.Background(),
		issuer, string(provider.ClientID), string(provider.ClientSecret),
		redirectURI, provider.Scopes, options...,
	)
	if err != nil {
		return nil, err
	}
	return &oIDCEndpoint{
		relyingParty:    relyingParty,
		jwt:             jwt,
		tokenManagement: tokenManagement{jwt: jwt},
		slugID:          provider.SlugID,
		urlParams:       provider.URLParams,
		issuer:          issuer,
		svc:             service{dao: dao},
	}, nil
}

func (e *oIDCEndpoint) CollectRoutes(g *route.Group) {
	g.GET(fmt.Sprintf("/%s/%s/%s", utils.AuthKindOIDC, e.slugID, utils.PathLogin), e.buildAuthHandler(), true)
	g.GET(fmt.Sprintf("/%s/%s/%s", utils.AuthKindOIDC, e.slugID, utils.PathCallback), e.buildCodeExchangeHandler(), true)
}

func (e *oIDCEndpoint) buildAuthHandler() echo.HandlerFunc {
	state := func() string {
		return uuid.New().String()
	}
	return func(ctx echo.Context) error {
		var opts []rp.URLParamOpt
		for key, val := range e.urlParams {
			opts = append(opts, rp.WithURLParam(key, val))
		}
		// If the Redirect URL is not setup by config, we build it from request
		if e.relyingParty.OAuthConfig().RedirectURL == "" {
			opts = append(opts, rp.WithURLParam("redirect_uri", getRedirectURI(ctx.Request(), utils.AuthKindOIDC, e.slugID)))
		}
		codeExchangeHandler := rp.AuthURLHandler(state, e.relyingParty, opts...)
		handler := echo.WrapHandler(codeExchangeHandler)
		return handler(ctx)
	}
}

func (e *oIDCEndpoint) buildCodeExchangeHandler() echo.HandlerFunc {
	marshalUserinfo := func(w http.ResponseWriter, r *http.Request, _ *oidc.Tokens[*oidc.IDTokenClaims], _ string, _ rp.RelyingParty, info *oidcUserInfo) {
		redirectURI := r.URL.Query().Get("redirect_uri")
		if redirectURI == "" {
			redirectURI = "/"
		}
		// We don´t forget to set the issuer before making any sync in the database.
		info.issuer = e.issuer

		user, err := e.svc.syncUser(info)
		if err != nil {
			e.logWithError(err).Error("Failed to sync user in database.")
			w.WriteHeader(http.StatusInternalServerError)
			writeResponse(w, []byte(apiinterface.InternalError.Error()))
			return
		}

		username := user.GetMetadata().GetName()
		setCookie := func(cookie *http.Cookie) {
			http.SetCookie(w, cookie)
		}
		if _, err := e.tokenManagement.accessToken(username, setCookie); err != nil {
			e.logWithError(err).Error("Failed to generate and save access token.")
			w.WriteHeader(http.StatusInternalServerError)
			writeResponse(w, []byte(apiinterface.InternalError.Error()))
			return
		}
		if _, err := e.tokenManagement.refreshToken(username, setCookie); err != nil {
			e.logWithError(err).Error("Failed to generate and save refresh token.")
			w.WriteHeader(http.StatusInternalServerError)
			writeResponse(w, []byte(apiinterface.InternalError.Error()))
			return
		}

		http.Redirect(w, r, redirectURI, http.StatusFound)
	}

	return func(ctx echo.Context) error {
		var opts []rp.URLParamOpt
		// If the Redirect URL is not setup by config, we build it from request
		if e.relyingParty.OAuthConfig().RedirectURL == "" {
			opts = append(opts, rp.WithURLParam("redirect_uri", getRedirectURI(ctx.Request(), utils.AuthKindOIDC, e.slugID)))
		}
		codeExchangeHandler := rp.CodeExchangeHandler(rp.UserinfoCallback(marshalUserinfo), e.relyingParty, opts...)
		handler := echo.WrapHandler(codeExchangeHandler)
		return handler(ctx)
	}
}

func (e *oIDCEndpoint) logWithError(err error) *logrus.Entry {
	return logrus.WithError(err).WithField("provider", e.slugID)
}

func writeResponse(w http.ResponseWriter, response []byte) {
	if _, err := w.Write(response); err != nil {
		logrus.WithError(err).Error("error writing http response")
	}
}
