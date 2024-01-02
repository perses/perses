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

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/crypto"
	"github.com/perses/perses/internal/api/shared/route"
	"github.com/perses/perses/internal/api/shared/utils"
	"github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/config"
)

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
		oidcEp, err := newOIDCEndpoint(provider, jwt)
		if err != nil {
			return nil, err
		}
		ep.endpoints = append(ep.endpoints, oidcEp)
	}

	// Register the OAuth providers if any
	for _, provider := range providers.OAuth {
		ep.endpoints = append(ep.endpoints, newOAuthEndpoint(provider, jwt))
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
			return shared.HandleBadRequestError(bindErr.Error())
		}
		refreshToken = body.RefreshToken
	} else {
		refreshToken = refreshTokenCookie.Value
	}
	if len(refreshToken) == 0 {
		return shared.HandleBadRequestError("no refresh token has been found")
	}
	claims, err := e.jwt.ValidateRefreshToken(refreshToken)
	if err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	accessToken, err := e.tokenManagement.accessToken(claims.Subject, ctx.SetCookie)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, api.AuthResponse{
		AccessToken: accessToken,
	})
}

func (e *endpoint) logout(ctx echo.Context) error {
	jwtHeaderPayloadCookie, signatureCookie := e.jwt.DeleteAccessTokenCookie()
	ctx.SetCookie(e.jwt.DeleteRefreshTokenCookie())
	ctx.SetCookie(jwtHeaderPayloadCookie)
	ctx.SetCookie(signatureCookie)

	return ctx.Redirect(302, "/")
}
