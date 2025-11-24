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
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/gorilla/securecookie"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	"github.com/perses/perses/internal/api/crypto"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
	"github.com/zitadel/oidc/v3/pkg/oidc"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"
)

const stateParam = "state"
const codeVerifierParam = "code_verifier"

var defaultLoginProps = []string{"login", "username"}

func newOAuthConfig(provider config.OAuthProvider, override *config.OAuthOverride) oauth2.Config {
	// Mandatory URLS. They are validated as non nil from the config (see config.OauthProvider.Verify)
	authURL := provider.AuthURL.String()
	tokenURL := provider.TokenURL.String()

	// Optional URLS. They can be empty
	redirectURI := ""
	if !provider.RedirectURI.IsNilOrEmpty() {
		redirectURI = provider.RedirectURI.String()
	}
	deviceAuthURL := ""
	if !provider.DeviceAuthURL.IsNilOrEmpty() {
		deviceAuthURL = provider.DeviceAuthURL.String()
	}

	conf := oauth2.Config{
		ClientID:     string(provider.ClientID),
		ClientSecret: string(provider.ClientSecret),
		Scopes:       provider.Scopes,
		Endpoint: oauth2.Endpoint{
			AuthURL:       authURL,
			DeviceAuthURL: deviceAuthURL,
			TokenURL:      tokenURL,
		},
		RedirectURL: redirectURI,
	}
	if override != nil {
		if override.ClientID != "" {
			conf.ClientID = string(override.ClientID)
		}
		if override.ClientSecret != "" {
			conf.ClientSecret = string(override.ClientSecret)
		}
		if override.Scopes != nil {
			conf.Scopes = override.Scopes
		}
	}
	return conf
}

type oauthUserInfo struct {
	externalUserInfoProfile
	RawProperties map[string]any
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
	conf            oauth2.Config
	deviceCodeConf  oauth2.Config
	clientCredConf  oauth2.Config
	httpClient      *http.Client
	secureCookie    *securecookie.SecureCookie
	jwt             crypto.JWT
	tokenManagement tokenManagement
	slugID          string
	userInfoURL     string
	authURL         url.URL
	svc             service
	loginProps      []string
}

func newOAuthEndpoint(provider config.OAuthProvider, jwt crypto.JWT, dao user.DAO, authz authorization.Authorization) (route.Endpoint, error) {
	// As the cookie is used only at login time, we don't need a persistent value here.
	// (same reason as newOIDCEndpoint)
	key := securecookie.GenerateRandomKey(16)
	secureCookie := securecookie.New(key, key)

	conf := newOAuthConfig(provider, nil)
	deviceCodeConf := conf
	if provider.DeviceCode != nil {
		deviceCodeConf = newOAuthConfig(provider, provider.DeviceCode)
	}
	clientCredConf := conf
	if provider.ClientCredentials != nil {
		clientCredConf = newOAuthConfig(provider, provider.ClientCredentials)
	}

	loginProps := defaultLoginProps
	if customProp := provider.CustomLoginProperty; customProp != "" {
		loginProps = []string{customProp}
	}

	httpClient, err := newHTTPClient(provider.HTTP)
	if err != nil {
		return nil, err
	}

	return &oAuthEndpoint{
		conf:            conf,
		deviceCodeConf:  deviceCodeConf,
		clientCredConf:  clientCredConf,
		httpClient:      httpClient,
		secureCookie:    secureCookie,
		jwt:             jwt,
		tokenManagement: tokenManagement{jwt: jwt},
		slugID:          provider.SlugID,
		userInfoURL:     provider.UserInfosURL.String(),
		authURL:         *provider.AuthURL.URL,
		svc:             service{dao: dao, authz: authz},
		loginProps:      loginProps,
	}, nil
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

// newQueryContext build a specific context for the oauth provider.
// It allows us to set up tls config hacking the http client directly in the given context
// Ref: https://github.com/golang/oauth2/issues/187
func (e *oAuthEndpoint) newQueryContext(ctx echo.Context) context.Context {
	return context.WithValue(ctx.Request().Context(), oauth2.HTTPClient, e.httpClient)
}

func (e *oAuthEndpoint) CollectRoutes(g *route.Group) {
	oauthGroup := g.Group(fmt.Sprintf("/%s/%s", utils.AuthKindOAuth, e.slugID), withOAuthErrorMdw)

	// Add routes for the "Authorization Code" flow
	oauthGroup.GET(fmt.Sprintf("/%s", utils.PathLogin), e.authHandler, true)
	oauthGroup.GET(fmt.Sprintf("/%s", utils.PathCallback), e.codeExchangeHandler, true)

	// Add routes for device code flow and token exchange
	oauthGroup.POST(fmt.Sprintf("/%s", utils.PathDeviceCode), e.deviceCodeHandler, true)
	oauthGroup.POST(fmt.Sprintf("/%s", utils.PathToken), e.tokenHandler, true)
}

// authHandler is the http handler on Perses side that triggers the "Authorization Code"
// flow to the oauth 2.0 provider.
// It will redirect the user to the provider's "auth" url.
func (e *oAuthEndpoint) authHandler(ctx echo.Context) error {

	// Save the state cookie, will be verified in the codeExchangeHandler
	state := ctx.Request().URL.Query().Get(redirectQueryParam)
	if err := e.saveStateCookie(ctx, state); err != nil {
		e.logWithError(err).Error("Failed to save state in a cookie.")
		return err
	}

	// Save the PKCE code verifier cookie, will be verified in the codeExchangeHandler
	verifier := oauth2.GenerateVerifier()
	if err := e.saveCodeVerifierCookie(ctx, verifier); err != nil {
		e.logWithError(err).Error("Failed to save code verifier in a cookie.")
		return err
	}
	opts := []oauth2.AuthCodeOption{oauth2.S256ChallengeOption(verifier)}

	// If the Redirect URL is not setup by config, we build it from request
	if e.conf.RedirectURL == "" {
		opts = append(opts, oauth2.SetAuthURLParam(redirectURIQueryParam, getRedirectURI(ctx.Request(), utils.AuthKindOAuth, e.slugID)))
	}

	// Redirect user to consent page to ask for permission
	// for the scopes specified above.
	return ctx.Redirect(302, e.conf.AuthCodeURL(state, opts...))
}

// codeExchangeHandler is the http handler on Perses side that will be called back by
// the oauth 2.0 provider during "Authorization Code" flow.
// This handler will then take in charge:
//   - the generation of the oauth 2.0 provider's access token from the code
//     (calling provider's "token" url)
//   - the retrieval of the user information from the token and also possibly requesting the
//     "user infos" url (if given)
//   - save the user in database if it's a new user, or update it with the collected information
//   - ultimately, generate a Perses user session with an access and refresh token
func (e *oAuthEndpoint) codeExchangeHandler(ctx echo.Context) error {
	code := ctx.QueryParam("code")

	// Verify that the state in the query match the saved one
	state, err := e.readStateCookie(ctx)
	if err != nil {
		e.logWithError(err).Error("An error occurred while verifying the state")
		return err
	}
	redirectURI := state

	// Verify that the PKCE code verifier is present
	verifier, err := e.readCodeVerifierCookie(ctx)
	if err != nil {
		e.logWithError(err).Error("An error occurred while verifying the state")
		return err
	}

	opts := []oauth2.AuthCodeOption{oauth2.VerifierOption(verifier)}

	// If the Redirect URL is not setup by config, we build it from request
	// TODO: Is it really necessary for a token redeem?
	if e.conf.RedirectURL == "" {
		opts = append(opts, oauth2.SetAuthURLParam(redirectURIQueryParam, getRedirectURI(ctx.Request(), utils.AuthKindOAuth, e.slugID)))
	}

	providerCtx := e.newQueryContext(ctx)

	// Exchange the authorization code with a token
	token, err := e.conf.Exchange(providerCtx, code, opts...)
	if err != nil {
		e.logWithError(err).Error("An error occurred while exchanging code with token")
		return err
	}

	uInfo, err := e.requestUserInfo(providerCtx, token)
	if err != nil {
		e.logWithError(err).Error("An error occurred while requesting user infos. User infos will be ignored.")
		return err
	}

	_, err = e.performUserSync(uInfo, ctx.SetCookie)
	if err != nil {
		return err
	}

	return ctx.Redirect(http.StatusFound, redirectURI)
}

// deviceCodeHandler is the http handler on Perses side that will trigger the "Device Authorization"
// flow to the oauth 2.0 provider.
// It will return the provider's DeviceAuthResponse as is, containing some information for the
// user to login in a browser.
// Then the client will be responsible to poll the /{slug_id}/token Perses endpoint to generate
// a proper Perses session.
func (e *oAuthEndpoint) deviceCodeHandler(ctx echo.Context) error {
	if e.deviceCodeConf.Endpoint.DeviceAuthURL == "" {
		e.logWithError(errors.New("device code flow is not supported by this provider"))
		return echo.NewHTTPError(http.StatusNotImplemented, "Device code flow is not supported by this provider")
	}

	resp, err := e.deviceCodeConf.DeviceAuth(e.newQueryContext(ctx))
	if err != nil {
		return err
	}
	return ctx.JSON(200, resp)
}

// tokenHandler is the http handler on Perses side that will generate a proper Perses session.
// It is used only in case of device code flow and client credentials flow.
func (e *oAuthEndpoint) tokenHandler(ctx echo.Context) error {
	grantType := ctx.FormValue("grant_type")

	providerCtx := e.newQueryContext(ctx)

	var accessToken *oauth2.Token
	var err error
	switch api.GrantType(grantType) {
	case api.GrantTypeDeviceCode:
		deviceCode := ctx.FormValue("device_code")
		accessToken, err = e.retrieveDeviceAccessToken(providerCtx, deviceCode)
		if err != nil {
			// (We log a warning as the failure means most of the time that the user didn't authorize the app yet)
			e.logWithError(err).Warn("Failed to exchange device code for token")
			return err
		}
	case api.GrantTypeClientCredentials:
		// Extract client_id and client_secret from Authorization header
		clientID, clientSecret, ok := ctx.Request().BasicAuth()
		if !ok {
			err = &oauth2.RetrieveError{ErrorCode: string(oidc.InvalidRequest)}
			e.logWithError(err).Error("Invalid or missing Authorization header")
			return err
		}
		accessToken, err = e.retrieveClientCredentialsToken(providerCtx, clientID, clientSecret)
		if err != nil {
			e.logWithError(err).Error("Failed to exchange client credentials for token")
			return err
		}
	default:
		return &oauth2.RetrieveError{
			ErrorCode: string(oidc.UnsupportedGrantType), // Reuse oidc lib for convenience as they created an enum
		}
	}

	uInfo, err := e.requestUserInfo(providerCtx, accessToken)
	if err != nil {
		e.logWithError(err).Error("An error occurred while requesting user infos.")
		return err
	}

	resp, err := e.performUserSync(uInfo, ctx.SetCookie)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, resp)
}

// performUserSync performs user synchronization and generates access and refresh tokens.
func (e *oAuthEndpoint) performUserSync(userInfo externalUserInfo, setCookie func(cookie *http.Cookie)) (*oauth2.Token, error) {
	usr, err := e.svc.syncUser(userInfo)
	if err != nil {
		e.logWithError(err).Error("Failed to sync user in database.")
		return nil, &oauth2.RetrieveError{ErrorCode: string(oidc.InvalidRequest), ErrorDescription: err.Error()}
	}

	// Generate and save access and refresh tokens
	username := usr.GetMetadata().GetName()
	accessToken, err := e.tokenManagement.accessToken(username, setCookie)
	if err != nil {
		e.logWithError(err).Error("Failed to generate and save access token.")
		return nil, err
	}
	refreshToken, err := e.tokenManagement.refreshToken(username, setCookie)
	if err != nil {
		e.logWithError(err).Error("Failed to generate and save refresh token.")
		return nil, err
	}

	return &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    oidc.BearerToken,
	}, nil
}

// retrieveDeviceAccessToken exchanges the device code for an access token,
// from the OAuth 2.0 provider.
// We need to recreate it as the oauth2 package only exposes the poll mechanism in a whole.
func (e *oAuthEndpoint) retrieveDeviceAccessToken(ctx context.Context, deviceCode string) (*oauth2.Token, error) {
	// Prepare the request body
	values := url.Values{}
	values.Set("grant_type", string(oidc.GrantTypeDeviceCode))
	values.Set("device_code", deviceCode)

	// Create a new request using http
	req, newReqErr := http.NewRequest(http.MethodPost, e.deviceCodeConf.Endpoint.TokenURL, strings.NewReader(values.Encode()))
	if newReqErr != nil {
		return nil, newReqErr
	}

	// Add headers
	req.Header.Add("Accept", "application/json")
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(e.deviceCodeConf.ClientID, e.deviceCodeConf.ClientSecret)
	req = req.WithContext(ctx)

	// Send the request using the default HTTP Client
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	result, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Read the response body and decode it into an oauth2.Token
	var token *oauth2.Token
	if decodeErr := json.Unmarshal(result, &token); decodeErr != nil {
		return nil, decodeErr
	}

	if !token.Valid() {
		// APIs like GitHub might return the error with status code 200, then the token appears to be invalid, but it's
		// because we are parsing an oauth error as a token here...
		var oauthErr *api.OAuthError
		if decodeErr := json.Unmarshal(result, &oauthErr); decodeErr != nil {
			return nil, decodeErr
		}
		// This field will contain something if this a real oauth error
		if len(oauthErr.ErrorCode) > 0 {
			return nil, oauthErr
		}
		// Otherwise, we consider it as a token error
		return nil, errors.New("invalid token received")
	}
	return token, nil
}

// retrieveClientCredentialsToken exchanges the client credentials for an access token,
// from the OAuth 2.0 provider.
func (e *oAuthEndpoint) retrieveClientCredentialsToken(ctx context.Context, clientID, clientSecret string) (*oauth2.Token, error) {
	// Create a new client credentials Config
	conf := &clientcredentials.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		TokenURL:     e.clientCredConf.Endpoint.TokenURL,
		Scopes:       e.clientCredConf.Scopes,
	}

	// Use the Token method to retrieve the token
	token, err := conf.Token(ctx)
	if err != nil {
		var retrieveErr *oauth2.RetrieveError
		if errors.As(err, &retrieveErr) {
			if retrieveErr.ErrorCode == "" {
				return nil, apiinterface.InternalError
			}
		}
		return nil, err
	}
	if !token.Valid() {
		// APIs like GitHub might return an invalid token without error
		return token, errors.New("invalid token received")
	}
	return token, err
}

// requestUserInfo execute an HTTP request on the user infos url if provided.
func (e *oAuthEndpoint) requestUserInfo(ctx context.Context, token *oauth2.Token) (externalUserInfo, error) {
	resp, err := e.conf.Client(ctx, token).Get(e.userInfoURL)
	if err != nil {
		return nil, err
	}
	defer func() { _ = resp.Body.Close() }()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	userInfos := oauthUserInfo{
		authURL:   e.authURL,
		loginKeys: e.loginProps,
	}

	if err = json.Unmarshal(body, &userInfos); err != nil {
		return nil, err
	}

	// Parse a second time into a more generic structure in order to possibly make some extra retrievals.
	// Indeed, oauth providers are not constraint to respect any guidance and login/subject can come from any field.
	if err = json.Unmarshal(body, &userInfos.RawProperties); err != nil {
		return nil, err
	}

	return &userInfos, nil
}

// logWithError is a little logrus helper to log with given error and the provider slugID.
// example usages:
//
//	logWithError(err).Error("Failed to sync user in database.")
//	logWithError(err).Warn("A warning message")
func (e *oAuthEndpoint) logWithError(err error) *logrus.Entry {
	return logrus.WithError(err).WithField("provider", e.slugID)
}
