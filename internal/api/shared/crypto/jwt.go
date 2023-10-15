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

package crypto

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type JWTCustomClaims struct {
	jwt.RegisteredClaims
}

type JWT interface {
	SignedToken(login string) (string, error)
	Middleware(skipper middleware.Skipper) echo.MiddlewareFunc
}

type jwtImpl struct {
	key []byte
}

func (j *jwtImpl) SignedToken(login string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS512, &JWTCustomClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   login,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 1)),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	})
	// The type of the key depends on the signature method.
	// See https://golang-jwt.github.io/jwt/usage/signing_methods/#signing-methods-and-key-types.
	return token.SignedString(j.key)
}

func (j *jwtImpl) Middleware(skipper middleware.Skipper) echo.MiddlewareFunc {
	jwtMiddlewareConfig := echojwt.Config{
		Skipper: skipper,
		NewClaimsFunc: func(c echo.Context) jwt.Claims {
			return new(JWTCustomClaims)
		},
		SigningMethod: jwt.SigningMethodHS512.Name,
		SigningKey:    j.key,
	}
	return echojwt.WithConfig(jwtMiddlewareConfig)
}
