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
	"net/http"

	"github.com/perses/perses/internal/api/crypto"
	"github.com/perses/perses/internal/api/interface"
	"github.com/sirupsen/logrus"
)

type tokenManagement struct {
	jwt crypto.JWT
}

func (tm *tokenManagement) accessToken(login string, setCookie func(cookie *http.Cookie)) (string, error) {
	accessToken, err := tm.jwt.SignedAccessToken(login)
	if err != nil {
		logrus.WithError(err).Errorf("unable to generate the access token")
		return "", apiinterface.InternalError
	}
	jwtHeaderPayloadCookie, signatureCookie := tm.jwt.CreateAccessTokenCookie(accessToken)
	setCookie(jwtHeaderPayloadCookie)
	setCookie(signatureCookie)
	return accessToken, nil
}

func (tm *tokenManagement) refreshToken(login string, setCookie func(cookie *http.Cookie)) (string, error) {
	refreshToken, err := tm.jwt.SignedRefreshToken(login)
	if err != nil {
		logrus.WithError(err).Errorf("unable to generate the refresh token")
		return "", apiinterface.InternalError
	}
	setCookie(tm.jwt.CreateRefreshTokenCookie(refreshToken))
	return refreshToken, nil
}
