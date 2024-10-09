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
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	"github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	clientConfig "github.com/perses/perses/pkg/client/config"
	"github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/zitadel/oidc/v3/pkg/oidc"
	"golang.org/x/oauth2"
)

const (
	xForwardedProto = "X-Forwarded-Proto"
	xForwardedHost  = "X-Forwarded-Host"
)

func getRedirectURI(r *http.Request, authKind string, slugID string) string {
	rd := url.URL{}

	// Get the host trying first the X-Forwarded-Host header, otherwise take it from request
	rd.Host = r.Header.Get(xForwardedHost)
	if rd.Host == "" {
		rd.Host = r.Host
	}

	// Get the scheme trying first the X-Forwarded-Proto header, otherwise take it from request
	rd.Scheme = r.Header.Get(xForwardedProto)
	if rd.Scheme == "" {
		rd.Scheme = "http"
		if r.TLS != nil {
			rd.Scheme = "https"
		}
	}

	rd.Path = fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, authKind, slugID, utils.PathCallback)
	return rd.String()
}

// newHTTPClient is a simple http client builder designed to be used for the queries to external authentication providers.
func newHTTPClient(httpConfig config.HTTP) (*http.Client, error) {
	roundTripper, err := clientConfig.NewRoundTripper(time.Duration(httpConfig.Timeout), httpConfig.TLSConfig)
	if err != nil {
		return nil, err
	}
	return &http.Client{
		Timeout:   time.Duration(httpConfig.Timeout),
		Transport: roundTripper,
	}, nil
}

type endpoint struct {
	endpoints       []route.Endpoint
	jwt             crypto.JWT
	tokenManagement tokenManagement
	isAuthEnable    bool
}

func New(dao user.DAO, jwt crypto.JWT, providers config.AuthProviders, isAuthEnable bool) (route.Endpoint, error) {
	ep := &endpoint{
		jwt:             jwt,
		tokenManagement: tokenManagement{jwt: jwt},
		isAuthEnable:    isAuthEnable,
	}

	// Register the native provider if enabled
	if providers.EnableNative {
		ep.endpoints = append(ep.endpoints, newNativeEndpoint(dao, jwt))
	}

	// Register the OIDC providers if any
	for _, provider := range providers.OIDC {
		oidcEp, err := newOIDCEndpoint(provider, jwt, dao)
		if err != nil {
			return nil, err
		}
		ep.endpoints = append(ep.endpoints, oidcEp)
	}

	// Register the OAuth providers if any
	for _, provider := range providers.OAuth {
		oauthEp, err := newOAuthEndpoint(provider, jwt, dao)
		if err != nil {
			return nil, err
		}
		ep.endpoints = append(ep.endpoints, oauthEp)
	}
	return ep, nil
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	if !e.isAuthEnable {
		return
	}
	providersGroup := g.Group(fmt.Sprintf("/%s", utils.PathAuthProviders))
	for _, ep := range e.endpoints {
		ep.CollectRoutes(providersGroup)
	}
	g.POST(fmt.Sprintf("/%s/%s", utils.PathAuth, utils.PathRefresh), e.refresh, true)
	g.GET(fmt.Sprintf("/%s/%s", utils.PathAuth, utils.PathLogout), e.logout, true)
}

func (e *endpoint) refresh(ctx echo.Context) error {
	// First, let's try to get the refresh token from the Cookie
	var refreshToken string
	refreshTokenCookie, err := ctx.Cookie(crypto.CookieKeyRefreshToken)
	if errors.Is(err, http.ErrNoCookie) {
		// In that case, let's decode the body if exists
		body := &api.RefreshRequest{}
		if bindErr := ctx.Bind(body); bindErr != nil {
			return apiinterface.HandleBadRequestError(bindErr.Error())
		}
		refreshToken = body.RefreshToken
	} else {
		refreshToken = refreshTokenCookie.Value
	}
	if len(refreshToken) == 0 {
		return apiinterface.HandleBadRequestError("no refresh token has been found")
	}
	claims, err := e.jwt.ValidateRefreshToken(refreshToken)
	if err != nil {
		return apiinterface.HandleBadRequestError(err.Error())
	}
	accessToken, err := e.tokenManagement.accessToken(claims.Subject, ctx.SetCookie)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    oidc.BearerToken,
	})
}

func (e *endpoint) logout(ctx echo.Context) error {
	jwtHeaderPayloadCookie, signatureCookie := e.jwt.DeleteAccessTokenCookie()
	ctx.SetCookie(e.jwt.DeleteRefreshTokenCookie())
	ctx.SetCookie(jwtHeaderPayloadCookie)
	ctx.SetCookie(signatureCookie)

	return ctx.Redirect(302, "/")
}

// withOAuthErrorMdw applies to the handler a middleware that the error is well managed in oauth2.0 context.
// This will transform any oauth2.0 retrieve token error into a bad request error, as suggested in the specs:
// https://www.rfc-editor.org/rfc/rfc6749#section-5.2
// https://www.rfc-editor.org/rfc/rfc8628#section-3.5
// Otherwise, and only if the error is not an explicit Perses or HTTP error, we send back an opaque InternalError.
func withOAuthErrorMdw(handler echo.HandlerFunc) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		err := handler(ctx)
		if err == nil {
			return nil
		}

		// This error is an oauth error generated by us
		oauthErr := &api.OAuthError{}
		if errors.As(err, &oauthErr) {
			return ctx.JSON(http.StatusBadRequest, oauthErr)
		}
		// This error is the token error that could come from the oauth2 library
		retrieveError := &oauth2.RetrieveError{}
		if errors.As(err, &retrieveError) {
			oauthError := api.OAuthError{
				ErrorCode:        retrieveError.ErrorCode,
				ErrorDescription: retrieveError.ErrorDescription,
			}
			return ctx.JSON(http.StatusBadRequest, oauthError)
		}

		// This error is the oidc error that could come from the oidc library
		oidcError := &oidc.Error{}
		if errors.As(err, &oidcError) {
			oauthError := api.OAuthError{
				ErrorCode:        string(oidcError.ErrorType),
				ErrorDescription: oidcError.Description,
			}
			return ctx.JSON(http.StatusBadRequest, oauthError)
		}

		return err
	}
}
