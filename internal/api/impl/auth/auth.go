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
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/crypto"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/pkg/model/api"
	"github.com/sirupsen/logrus"
)

type Endpoint struct {
	dao          user.DAO
	jwt          crypto.JWT
	isAuthEnable bool
}

func New(dao user.DAO, jwt crypto.JWT, isAuthEnable bool) *Endpoint {
	return &Endpoint{
		dao:          dao,
		jwt:          jwt,
		isAuthEnable: isAuthEnable,
	}
}

func (e *Endpoint) CollectRoutes(g *shared.Group) {
	if e.isAuthEnable {
		g.POST("/auth", e.auth, true)
		g.POST("/auth/refresh", e.refresh, true)
	}
}

func (e *Endpoint) auth(ctx echo.Context) error {
	body := &api.Auth{}
	if err := ctx.Bind(body); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	usr, err := e.dao.Get(body.Login)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			return shared.HandleBadRequestError("wrong login or password ")
		}
	}

	if !crypto.ComparePasswords(usr.Spec.Password, body.Password) {
		return shared.HandleBadRequestError("wrong login or password ")
	}
	accessToken, err := e.accessToken(ctx, body.Login)
	if err != nil {
		return err
	}
	refreshToken, err := e.refreshToken(ctx, body.Login)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, api.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

func (e *Endpoint) refresh(ctx echo.Context) error {
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
	accessToken, err := e.accessToken(ctx, claims.Subject)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, api.AuthResponse{
		AccessToken: accessToken,
	})
}

func (e *Endpoint) accessToken(ctx echo.Context, login string) (string, error) {
	accessToken, err := e.jwt.SignedAccessToken(login)
	if err != nil {
		logrus.WithError(err).Errorf("unable to generate the access token")
		return "", shared.InternalError
	}
	jwtHeaderPayloadCookie, signatureCookie := e.jwt.CreateAccessTokenCookie(accessToken)
	ctx.SetCookie(jwtHeaderPayloadCookie)
	ctx.SetCookie(signatureCookie)
	return accessToken, nil
}

func (e *Endpoint) refreshToken(ctx echo.Context, login string) (string, error) {
	refreshToken, err := e.jwt.SignedRefreshToken(login)
	if err != nil {
		logrus.WithError(err).Errorf("unable to generate the refresh token")
		return "", shared.InternalError
	}
	ctx.SetCookie(e.jwt.CreateRefreshTokenCookie(refreshToken))
	return refreshToken, nil
}
