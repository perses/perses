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
	"net/url"

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
	"golang.org/x/oauth2"
)

const stateParam = "state"
const codeVerifierParam = "code_verifier"

var defaultLoginProps = []string{"login", "username"}

type oauthUserInfo struct {
	externalUserInfoProfile
	RawProperties map[string]interface{}
	loginKeys     []string
	authURL       url.URL
}

func (u *oauthUserInfo) getProperty(keys []string) string {
	for _, key := range keys {
		if value, ok := u.RawProperties[key]; ok {
			// Ensure it is a string. This makes sure for example that an int is well transformed into a string
			return fmt.Sprint(value)
		}
	}
	return ""
}

// GetLogin implements [externalUserInfo]
func (u *oauthUserInfo) GetLogin() string {
	if login := u.getProperty(u.loginKeys); login != "" {
		return login
	}
	return buildLoginFromEmail(u.Email)
}

// GetProfile implements [externalUserInfo]
func (u *oauthUserInfo) GetProfile() externalUserInfoProfile {
	return u.externalUserInfoProfile
}

// GetProviderContext implements [externalUserInfo]
func (u *oauthUserInfo) GetProviderContext() v1.OAuthProvider {
	return v1.OAuthProvider{
		// As there's no particular issuer in oauth2 generic, we recreate a fake issuer from authURL
		Issuer:  u.authURL.Hostname(),
		Email:   u.Email,
		Subject: u.GetLogin(),
	}
}

type oAuthEndpoint struct {
	conf            *oauth2.Config
	secureCookie    *securecookie.SecureCookie
	jwt             crypto.JWT
	tokenManagement tokenManagement
	slugID          string
	userInfoURL     string
	authURL         url.URL
	svc             service
	loginProps      []string
}

func newOAuthEndpoint(params config.OAuthProvider, jwt crypto.JWT, dao user.DAO) route.Endpoint {
	// URLS are validated as non nil from the config (see config.OauthProvider.Verify)
	authURL := *params.AuthURL.URL
	tokenURL := params.TokenURL.String()
	userInfosURL := params.UserInfosURL.String()
	redirectURI := ""
	if !params.RedirectURI.IsNilOrEmpty() {
		redirectURI = params.RedirectURI.String()
	}

	// As the cookie is used only at login time, we don't need a persistent value here.
	// (same reason as newOIDCEndpoint)
	key := securecookie.GenerateRandomKey(16)
	secureCookie := securecookie.New(key, key)
	conf := &oauth2.Config{
		ClientID:     string(params.ClientID),
		ClientSecret: string(params.ClientSecret),
		Scopes:       params.Scopes,
		Endpoint: oauth2.Endpoint{
			AuthURL:  authURL.String(),
			TokenURL: tokenURL,
		},
		RedirectURL: redirectURI,
	}

	loginProps := defaultLoginProps
	if customProp := params.CustomLoginProperty; customProp != "" {
		loginProps = []string{customProp}
	}

	return &oAuthEndpoint{
		conf:            conf,
		secureCookie:    secureCookie,
		jwt:             jwt,
		tokenManagement: tokenManagement{jwt: jwt},
		slugID:          params.SlugID,
		userInfoURL:     userInfosURL,
		authURL:         authURL,
		svc:             service{dao: dao},
		loginProps:      loginProps,
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
		e.logWithError(err).Error("Failed to save state in a cookie.")
		return apiinterface.InternalError
	}

	// Save the PKCE code verifier cookie, will be verified in the codeExchangeHandler
	verifier := oauth2.GenerateVerifier()
	if err := e.saveCodeVerifierCookie(ctx, verifier); err != nil {
		e.logWithError(err).Error("Failed to save code verifier in a cookie.")
		return apiinterface.InternalError
	}
	opts := []oauth2.AuthCodeOption{oauth2.S256ChallengeOption(verifier)}

	// If the Redirect URL is not setup by config, we build it from request
	if e.conf.RedirectURL == "" {
		opts = append(opts, oauth2.SetAuthURLParam("redirect_uri", getRedirectURI(ctx.Request(), utils.AuthKindOAuth, e.slugID)))
	}

	// Redirect user to consent page to ask for permission
	// for the scopes specified above.
	return ctx.Redirect(302, e.conf.AuthCodeURL(state, opts...))
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
		return apiinterface.InternalError
	}

	// Verify that the PKCE code verifier is present
	verifier, err := e.readCodeVerifierCookie(ctx)
	if err != nil {
		e.logWithError(err).Error("An error occurred while verifying the state")
		return apiinterface.InternalError
	}

	opts := []oauth2.AuthCodeOption{oauth2.VerifierOption(verifier)}

	// If the Redirect URL is not setup by config, we build it from request
	if e.conf.RedirectURL == "" {
		opts = append(opts, oauth2.SetAuthURLParam("redirect_uri", getRedirectURI(ctx.Request(), utils.AuthKindOAuth, e.slugID)))
	}

	// Exchange the authorization code with a token
	token, err := e.conf.Exchange(ctx.Request().Context(), code, opts...)
	if err != nil {
		e.logWithError(err).Error("An error occurred while exchanging code with token")
		return apiinterface.InternalError
	}

	uInfoBody, err := e.requestUserInfo(ctx, token)
	if err != nil {
		e.logWithError(err).Warn("An error occurred while requesting user infos. User infos will be ignored.")
		// We continue here on purpose, to give a chance to the token to be parsed
	}

	uInfo, err := e.buildUserInfo(uInfoBody)
	if err != nil {
		e.logWithError(err).Error("Failed to collect user infos.")
		return apiinterface.InternalError
	}

	// Save the user in database
	entity, err := e.svc.syncUser(uInfo)
	if err != nil {
		e.logWithError(err).Error("Failed to sync user in database.")
		return apiinterface.InternalError
	}

	username := entity.GetMetadata().GetName()
	_, err = e.tokenManagement.accessToken(username, ctx.SetCookie)
	if err != nil {
		e.logWithError(err).Error("Failed to generate and save access token.")
		return apiinterface.InternalError
	}
	_, err = e.tokenManagement.refreshToken(username, ctx.SetCookie)
	if err != nil {
		e.logWithError(err).Error("Failed to generate and save refresh token.")
		return apiinterface.InternalError
	}

	return ctx.Redirect(302, "/")
}

// requestUserInfo execute an HTTP request on the user infos url if provided.
func (e *oAuthEndpoint) requestUserInfo(ctx echo.Context, token *oauth2.Token) ([]byte, error) {
	resp, err := e.conf.Client(ctx.Request().Context(), token).Get(e.userInfoURL)
	defer func() { _ = resp.Body.Close() }()
	if err != nil {
		return nil, err
	}

	return io.ReadAll(resp.Body)
}

// buildUserInfo will collect all the information needed to create/update the user in database.
func (e *oAuthEndpoint) buildUserInfo(body []byte) (externalUserInfo, error) {
	userInfos := oauthUserInfo{
		authURL:   e.authURL,
		loginKeys: e.loginProps,
	}

	if err := json.Unmarshal(body, &userInfos); err != nil {
		return nil, err
	}

	// Parse a second time into a more generic structure in order to possibly make some extra retrievals.
	// Indeed, oauth providers are not constraint to respect any guidance and login/subject can come from any field.
	if err := json.Unmarshal(body, &userInfos.RawProperties); err != nil {
		return nil, err
	}

	return &userInfos, nil
}

func (e *oAuthEndpoint) logWithError(err error) *logrus.Entry {
	return logrus.WithError(err).WithField("provider", e.slugID)
}
