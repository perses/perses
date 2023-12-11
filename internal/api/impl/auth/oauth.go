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
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/securecookie"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/crypto"
	"github.com/perses/perses/internal/api/shared/route"
	"github.com/perses/perses/internal/api/shared/utils"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/sirupsen/logrus"
	"golang.org/x/oauth2"
)

const stateParam = "state"
const codeVerifierParam = "code_verifier"

// userInfo is a structure used only in the context of oauth 2.0 user info retrieval.
// This is used to gather information before saving the user in database.
type userInfo struct {
	Login     string
	Email     string
	FirstName string
	LastName  string
}

// buildUserInfo will collect all the information needed to create/update the user in database.
// Two source of information are considered:
// - the access_token generated from the oauth 2.0 provider
// - [optionally] the body of a possible request to a user infos url
// In the future, this function could evolve into a method of a struct taking some configuration parameters
// to allow more customization on claim paths/JSON paths used.
func buildUserInfo(_ *oauth2.Token, body []byte, result *userInfo) error {
	// TODO(cegarcia): User Infos retrieval is currently strongly coupled with github provider
	//   (GET /user and take login from the json `login` field) but it's probably not the case with others.
	//   We should have user infos discovery to try to get the login from different ways (tokens/api with different claim paths/json paths)
	if body != nil {
		return json.Unmarshal(body, result)
	}
	return fmt.Errorf("not yet implemented")
}

type oAuthEndpoint struct {
	conf            *oauth2.Config
	secureCookie    *securecookie.SecureCookie
	jwt             crypto.JWT
	tokenManagement tokenManagement
	slugID          string
	userInfoURL     string
}

func newOAuthEndpoint(params config.OAuthProvider, jwt crypto.JWT) route.Endpoint {
	// As the cookie is used only at login time, we don't need a persistent value here.
	// (same reason as newOIDCEndpoint)
	key := securecookie.GenerateRandomKey(16)
	secureCookie := securecookie.New(key, key)
	conf := &oauth2.Config{
		ClientID:     string(params.ClientID),
		ClientSecret: string(params.ClientSecret),
		Scopes:       params.Scopes,
		Endpoint: oauth2.Endpoint{
			AuthURL:  params.AuthURL,
			TokenURL: params.TokenURL,
		},
		RedirectURL: params.RedirectURI,
	}

	return &oAuthEndpoint{
		conf:            conf,
		secureCookie:    secureCookie,
		jwt:             jwt,
		tokenManagement: tokenManagement{jwt: jwt},
		slugID:          params.SlugID,
		userInfoURL:     params.UserInfosURL,
	}
}

func (e *oAuthEndpoint) setCookie(ctx echo.Context, name, value string) error {
	encoded, err := e.secureCookie.Encode(name, value)
	if err != nil {
		return err
	}
	ctx.SetCookie(&http.Cookie{
		Name:     name,
		Value:    encoded,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	})
	return nil
}

func (e *oAuthEndpoint) deleteCookie(ctx echo.Context, name string) {
	ctx.SetCookie(&http.Cookie{
		Name:     name,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	})
}

func (e *oAuthEndpoint) checkCookie(ctx echo.Context, name string) (string, error) {
	cookie, err := ctx.Cookie(name)
	if err != nil {
		return "", err
	}
	var value string
	if err := e.secureCookie.Decode(name, cookie.Value, &value); err != nil {
		return "", err
	}
	return value, nil
}

func (e *oAuthEndpoint) checkQueryCookie(ctx echo.Context, name string) (string, error) {
	value, err := e.checkCookie(ctx, name)
	if err != nil {
		return "", err
	}
	if value != ctx.FormValue(name) {
		return "", errors.New(name + " does not compare")
	}
	return value, nil
}

func (e *oAuthEndpoint) saveStateCookie(ctx echo.Context, state string) error {
	return e.setCookie(ctx, stateParam, state)
}

func (e *oAuthEndpoint) saveCodeVerifierCookie(ctx echo.Context, code string) error {
	return e.setCookie(ctx, codeVerifierParam, code)
}

func (e *oAuthEndpoint) readStateCookie(ctx echo.Context) (state string, err error) {
	state, err = e.checkQueryCookie(ctx, stateParam)
	if err != nil {
		return "", err
	}
	e.deleteCookie(ctx, stateParam)
	return state, nil
}

func (e *oAuthEndpoint) readCodeVerifierCookie(ctx echo.Context) (state string, err error) {
	state, err = e.checkCookie(ctx, codeVerifierParam)
	if err != nil {
		return "", err
	}
	e.deleteCookie(ctx, codeVerifierParam)
	return state, nil
}

func (e *oAuthEndpoint) CollectRoutes(g *route.Group) {
	g.GET(fmt.Sprintf("/%s/%s/%s", utils.AuthKindOAuth, e.slugID, utils.PathLogin), e.authHandler, true)
	g.GET(fmt.Sprintf("/%s/%s/%s", utils.AuthKindOAuth, e.slugID, utils.PathCallback), e.codeExchangeHandler, true)
}

// authHandler is the http handler on Perses side that will trigger the "Authorization Code" flow to the oauth 2.0 provider.
// It will redirect the user to the provider's "auth" url.
func (e *oAuthEndpoint) authHandler(ctx echo.Context) error {

	// Save the state cookie, will be verified in the codeExchangeHandler
	state := uuid.NewString()
	if err := e.saveStateCookie(ctx, state); err != nil {
		return shared.UnauthorizedError
	}

	// Save the PKCE code verifier cookie, will be verified in the codeExchangeHandler
	verifier := oauth2.GenerateVerifier()
	if err := e.saveCodeVerifierCookie(ctx, verifier); err != nil {
		return shared.UnauthorizedError
	}

	// Redirect user to consent page to ask for permission
	// for the scopes specified above.
	return ctx.Redirect(302, e.conf.AuthCodeURL(state, oauth2.S256ChallengeOption(verifier)))
}

// codeExchangeHandler is the http handler on Perses side that will be called back by the oauth 2.0 provider during "Authorization Code" flow.
// This handler will then take in charge:
// - the generation of the oauth 2.0 provider's access token from the code (calling provider's "token" url)
// - the retrieval of the user information from the token and also possibly requesting the "user infos" url (if given)
// - save the user in database if it's a new user, or update it with the collected information
// - ultimately, generate a Perses user session with an access and refresh token
func (e *oAuthEndpoint) codeExchangeHandler(ctx echo.Context) error {
	code := ctx.QueryParam("code")

	// Verify that the state in the query match the saved one
	if _, err := e.readStateCookie(ctx); err != nil {
		e.logWithError(err).Error("An error occurred while verifying the state")
		return shared.UnauthorizedError
	}

	// Verify that the PKCE code verifier is present
	verifier, err := e.readCodeVerifierCookie(ctx)
	if err != nil {
		e.logWithError(err).Error("An error occurred while verifying the state")
		return shared.UnauthorizedError
	}

	// Exchange the authorization code with a token
	token, err := e.conf.Exchange(ctx.Request().Context(), code, oauth2.VerifierOption(verifier))
	if err != nil {
		e.logWithError(err).Error("An error occurred while exchanging code with token")
		return shared.UnauthorizedError
	}

	userInfosBody, err := e.requestUserInfos(ctx, token)
	if err != nil {
		e.logWithError(err).Warn("An error occurred while requesting user infos. User infos will be ignored.")
		// We continue here on purpose, to give a chance to the token to be parsed
	}

	var userInfos userInfo
	err = buildUserInfo(token, userInfosBody, &userInfos)
	if err != nil {
		e.logWithError(err).Error("Failed to collect user infos.")
		return shared.UnauthorizedError
	}

	// TODO(cegarcia): Make a user synchronization operation on the database
	login := userInfos.Login
	_, err = e.tokenManagement.accessToken(login, ctx.SetCookie)
	if err != nil {
		return shared.UnauthorizedError
	}
	_, err = e.tokenManagement.refreshToken(login, ctx.SetCookie)
	if err != nil {
		return shared.UnauthorizedError
	}

	return ctx.Redirect(302, "/")
}

// requestUserInfos execute an HTTP request on the user infos url if provided. The response is an array of bytes and is nil if user infos url is not provided.
func (e *oAuthEndpoint) requestUserInfos(ctx echo.Context, token *oauth2.Token) ([]byte, error) {
	if e.userInfoURL != "" {
		resp, err := e.conf.Client(ctx.Request().Context(), token).Get(e.userInfoURL)
		defer func() { _ = resp.Body.Close() }()
		if err != nil {
			return nil, err
		}

		return io.ReadAll(resp.Body)
	}
	return nil, nil
}

func (e *oAuthEndpoint) logWithError(err error) *logrus.Entry {
	return logrus.WithError(err).WithField("provider", e.slugID)
}
