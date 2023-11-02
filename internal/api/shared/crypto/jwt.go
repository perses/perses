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
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/sirupsen/logrus"
)

const (
	cookieKeyJWTPayload   = "jwtPayload"
	cookieKeyJWTSignature = "jwtSignature"
)

type JWTCustomClaims struct {
	jwt.RegisteredClaims
}

type JWT interface {
	SignedToken(login string) (string, error)
	// CreateJWTCookies will create two different cookies that contain a piece of the token.
	// As a reminder, a JWT token has the following structure: header.payload.signature
	// The first cookie will contain the struct header.payload that can then be manipulated by Javascript
	// The second cookie will contain the signature, and it won't be accessible by Javascript.
	CreateJWTCookies(token string) (*http.Cookie, *http.Cookie)
	Parse(token string) (*JWTCustomClaims, error)
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

func (j *jwtImpl) CreateJWTCookies(token string) (*http.Cookie, *http.Cookie) {
	expireDate := time.Now().Add(time.Hour * 1)
	tokenSplit := strings.Split(token, ".")
	maxAge := 3600
	path := "/"
	sameSite := http.SameSiteNoneMode
	secure := true
	headerPayloadCookie := &http.Cookie{
		Name:     cookieKeyJWTPayload,
		Value:    fmt.Sprintf("%s.%s", tokenSplit[0], tokenSplit[1]),
		Path:     path,
		MaxAge:   maxAge,
		Expires:  expireDate,
		Secure:   secure,
		HttpOnly: false,
		SameSite: sameSite,
	}
	signatureCookie := &http.Cookie{
		Name:     cookieKeyJWTSignature,
		Value:    tokenSplit[2],
		Path:     path,
		MaxAge:   maxAge,
		Expires:  expireDate,
		Secure:   secure,
		HttpOnly: true,
		SameSite: sameSite,
	}
	return headerPayloadCookie, signatureCookie
}

func (j *jwtImpl) Parse(token string) (*JWTCustomClaims, error) {
	jwtToken, err := jwt.ParseWithClaims(token, &JWTCustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return j.key, nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to parse token '%q': %w", token, err)
	}

	claims, ok := jwtToken.Claims.(*JWTCustomClaims)
	if !ok || !jwtToken.Valid {
		return nil, fmt.Errorf("failed to parse token claims: %w", err)
	}
	return claims, nil
}

func (j *jwtImpl) Middleware(skipper middleware.Skipper) echo.MiddlewareFunc {
	jwtMiddlewareConfig := echojwt.Config{
		Skipper: skipper,
		BeforeFunc: func(c echo.Context) {
			// Merge the JWT cookies if they exist to create the token,
			// and then set the header Authorization with the complete token.
			payloadCookie, err := c.Cookie(cookieKeyJWTPayload)
			if errors.Is(err, http.ErrNoCookie) {
				logrus.Tracef("cookie %q not found", cookieKeyJWTPayload)
				return
			}
			signatureCookie, err := c.Cookie(cookieKeyJWTSignature)
			if errors.Is(err, http.ErrNoCookie) {
				logrus.Tracef("cookie %q not found", cookieKeyJWTSignature)
				return
			}
			c.Request().Header.Set("Authorization", fmt.Sprintf("Bearer %s.%s", payloadCookie.Value, signatureCookie.Value))
		},
		NewClaimsFunc: func(c echo.Context) jwt.Claims {
			return new(JWTCustomClaims)
		},
		SigningMethod: jwt.SigningMethodHS512.Name,
		SigningKey:    j.key,
	}
	return echojwt.WithConfig(jwtMiddlewareConfig)
}
