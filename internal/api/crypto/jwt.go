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
	CookieKeyJWTPayload   = "jwtPayload"
	CookieKeyJWTSignature = "jwtSignature"
	CookieKeyRefreshToken = "jwtRefreshToken"
	cookiePath            = "/"
)

type JWTCustomClaims struct {
	jwt.RegisteredClaims
}

func signedToken(login string, notBefore time.Time, expireAt time.Time, key []byte) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS512, &JWTCustomClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   login,
			ExpiresAt: jwt.NewNumericDate(expireAt),
			NotBefore: jwt.NewNumericDate(notBefore),
		},
	})
	// The type of the key depends on the signature method.
	// See https://golang-jwt.github.io/jwt/usage/signing_methods/#signing-methods-and-key-types.
	return token.SignedString(key)
}

func ExtractJWTClaims(ctx echo.Context) *JWTCustomClaims {
	jwtToken, ok := ctx.Get("user").(*jwt.Token) // by default token is stored under `user` key
	if !ok {
		return nil
	}

	claims, ok := jwtToken.Claims.(*JWTCustomClaims)
	if !ok {
		return nil
	}
	return claims
}

type JWT interface {
	SignedAccessToken(login string) (string, error)
	SignedRefreshToken(login string) (string, error)
	// CreateAccessTokenCookie will create two different cookies that contain a piece of the token.
	// As a reminder, a JWT token has the following structure: header.payload.signature
	// The first cookie will contain the struct header.payload that can then be manipulated by Javascript
	// The second cookie will contain the signature, and it won't be accessible by Javascript.
	CreateAccessTokenCookie(accessToken string) (*http.Cookie, *http.Cookie)
	DeleteAccessTokenCookie() (*http.Cookie, *http.Cookie)
	CreateRefreshTokenCookie(refreshToken string) *http.Cookie
	DeleteRefreshTokenCookie() *http.Cookie
	ValidateRefreshToken(token string) (*JWTCustomClaims, error)
	Middleware(skipper middleware.Skipper) echo.MiddlewareFunc
}

type jwtImpl struct {
	accessKey       []byte
	refreshKey      []byte
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
}

func (j *jwtImpl) SignedAccessToken(login string) (string, error) {
	now := time.Now()
	return signedToken(login, now, now.Add(j.accessTokenTTL), j.accessKey)
}

func (j *jwtImpl) SignedRefreshToken(login string) (string, error) {
	now := time.Now()
	return signedToken(login, now, now.Add(j.refreshTokenTTL), j.refreshKey)
}

func (j *jwtImpl) CreateAccessTokenCookie(accessToken string) (*http.Cookie, *http.Cookie) {
	expireDate := time.Now().Add(j.accessTokenTTL)
	tokenSplit := strings.Split(accessToken, ".")
	sameSite := http.SameSiteNoneMode
	secure := true
	headerPayloadCookie := &http.Cookie{
		Name:     CookieKeyJWTPayload,
		Value:    fmt.Sprintf("%s.%s", tokenSplit[0], tokenSplit[1]),
		Path:     cookiePath,
		MaxAge:   int(j.accessTokenTTL.Seconds()),
		Expires:  expireDate,
		Secure:   secure,
		HttpOnly: false,
		SameSite: sameSite,
	}
	signatureCookie := &http.Cookie{
		Name:     CookieKeyJWTSignature,
		Value:    tokenSplit[2],
		Path:     cookiePath,
		MaxAge:   int(j.accessTokenTTL.Seconds()),
		Expires:  expireDate,
		Secure:   secure,
		HttpOnly: true,
		SameSite: sameSite,
	}
	return headerPayloadCookie, signatureCookie
}

func (j *jwtImpl) DeleteAccessTokenCookie() (*http.Cookie, *http.Cookie) {
	headerPayloadCookie := &http.Cookie{
		Name:     CookieKeyJWTPayload,
		Value:    "",
		Path:     cookiePath,
		MaxAge:   -1,
		HttpOnly: false,
	}
	signatureCookie := &http.Cookie{
		Name:     CookieKeyJWTSignature,
		Value:    "",
		Path:     cookiePath,
		MaxAge:   -1,
		HttpOnly: true,
	}
	return headerPayloadCookie, signatureCookie
}

func (j *jwtImpl) CreateRefreshTokenCookie(refreshToken string) *http.Cookie {
	return &http.Cookie{
		Name:     CookieKeyRefreshToken,
		Value:    refreshToken,
		Path:     cookiePath,
		MaxAge:   int(j.refreshTokenTTL.Seconds()),
		Expires:  time.Now().Add(j.refreshTokenTTL),
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteNoneMode,
	}
}

func (j *jwtImpl) DeleteRefreshTokenCookie() *http.Cookie {
	return &http.Cookie{
		Name:     CookieKeyRefreshToken,
		Value:    "",
		Path:     cookiePath,
		MaxAge:   -1,
		HttpOnly: true,
	}
}

func (j *jwtImpl) ValidateRefreshToken(token string) (*JWTCustomClaims, error) {
	parsedToken, err := jwt.ParseWithClaims(token, new(JWTCustomClaims), func(_ *jwt.Token) (interface{}, error) {
		return j.refreshKey, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS512.Name}))
	if err != nil {
		return nil, err
	}
	return parsedToken.Claims.(*JWTCustomClaims), nil
}

func (j *jwtImpl) Middleware(skipper middleware.Skipper) echo.MiddlewareFunc {
	jwtMiddlewareConfig := echojwt.Config{
		Skipper: skipper,
		BeforeFunc: func(c echo.Context) {
			// Merge the JWT cookies if they exist to create the token,
			// and then set the header Authorization with the complete token.
			payloadCookie, err := c.Cookie(CookieKeyJWTPayload)
			if errors.Is(err, http.ErrNoCookie) {
				logrus.Tracef("cookie %q not found", CookieKeyJWTPayload)
				return
			}
			signatureCookie, err := c.Cookie(CookieKeyJWTSignature)
			if errors.Is(err, http.ErrNoCookie) {
				logrus.Tracef("cookie %q not found", CookieKeyJWTSignature)
				return
			}
			c.Request().Header.Set("Authorization", fmt.Sprintf("Bearer %s.%s", payloadCookie.Value, signatureCookie.Value))
		},
		NewClaimsFunc: func(_ echo.Context) jwt.Claims {
			return new(JWTCustomClaims)
		},
		SigningMethod: jwt.SigningMethodHS512.Name,
		SigningKey:    j.accessKey,
	}
	return echojwt.WithConfig(jwtMiddlewareConfig)
}
