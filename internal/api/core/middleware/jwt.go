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

package middleware

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	crypto "github.com/perses/perses/internal/api/crypto"
	"github.com/sirupsen/logrus"
)

func JwtMiddleware(j crypto.JWT, skipper middleware.Skipper) echo.MiddlewareFunc {
	jwtMiddlewareConfig := echojwt.Config{
		Skipper: skipper,
		BeforeFunc: func(c echo.Context) {
			// Merge the JWT cookies if they exist to create the token,
			// and then set the header Authorization with the complete token.
			payloadCookie, err := c.Cookie(crypto.CookieKeyJWTPayload)
			if errors.Is(err, http.ErrNoCookie) {
				logrus.Tracef("cookie %q not found", crypto.CookieKeyJWTPayload)
				return
			}
			signatureCookie, err := c.Cookie(crypto.CookieKeyJWTSignature)
			if errors.Is(err, http.ErrNoCookie) {
				logrus.Tracef("cookie %q not found", crypto.CookieKeyJWTSignature)
				return
			}

			c.Request().Header.Set("Authorization", fmt.Sprintf("Bearer %s.%s", payloadCookie.Value, signatureCookie.Value))
		},
		NewClaimsFunc: func(_ echo.Context) jwt.Claims {
			return new(crypto.JWTCustomClaims)
		},
		SigningMethod: jwt.SigningMethodHS512.Name,
		SigningKey:    j.GetAccessKey(),
	}
	return echojwt.WithConfig(jwtMiddlewareConfig)
}
