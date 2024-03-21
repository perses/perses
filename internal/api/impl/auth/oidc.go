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
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/securecookie"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	"github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
	"github.com/zitadel/oidc/v3/pkg/client"
	"github.com/zitadel/oidc/v3/pkg/client/rp"
	httphelper "github.com/zitadel/oidc/v3/pkg/http"
	"github.com/zitadel/oidc/v3/pkg/oidc"
	"golang.org/x/oauth2"
)

// oidcUserInfo implements externalUserInfo for the OIDC providers
type oidcUserInfo struct {
	externalUserInfoProfile
	Subject string `json:"sub,omitempty"`
	// issuer is not supposed to be taken from json, but instead it must be set right before the db sync.
	issuer string
}

// GetSubject implements [rp.SubjectGetter]
func (u *oidcUserInfo) GetSubject() string {
	return u.Subject
}

// GetLogin implements [externalUserInfo]
// It uses the first part of the email to create the username.
func (u *oidcUserInfo) GetLogin() string {
	login := buildLoginFromEmail(u.Email)
	if len(login) > 0 {
		return login
	}
	return u.Subject
}

// GetProfile implements [externalUserInfo]
func (u *oidcUserInfo) GetProfile() externalUserInfoProfile {
	return u.externalUserInfoProfile
}

// GetProviderContext implements [externalUserInfo]
func (u *oidcUserInfo) GetProviderContext() v1.OAuthProvider {
	return v1.OAuthProvider{
		Issuer:  u.issuer,
		Email:   u.Email,
		Subject: u.Subject,
	}
}

type RelyingPartyWithTokenEndpoint struct {
	rp.RelyingParty
}

func (r RelyingPartyWithTokenEndpoint) TokenEndpoint() string {
	return r.OAuthConfig().Endpoint.TokenURL
}

func newRelyingParty(provider config.OIDCProvider, override *config.OAuthOverride) (*RelyingPartyWithTokenEndpoint, error) {
	issuer := provider.Issuer.String()
	redirectURI := ""
	if !provider.RedirectURI.IsNilOrEmpty() {
		redirectURI = provider.RedirectURI.String()
	}
	// As the cookie is used only at login time, we don't need a persistent value here.
	// The OIDC library will use it this way:
	// - Right before calling the /authorize provider's endpoint, it set "state" in a cookie and the "PKCE code challenge" in another
	// - Then it redirects to /authorize provider's endpoint that redirects back to our /callback endpoint
	// - Before calling the /token, the OIDC library will then take the "state" and "PKCE code challenge"
	//   from cookie to use them before deleting the cookies.
	key := securecookie.GenerateRandomKey(16)
	cookieHandler := httphelper.NewCookieHandler(key, key)
	httpClient := &http.Client{
		Timeout: time.Minute,
	}
	options := []rp.Option{
		rp.WithVerifierOpts(rp.WithIssuedAtOffset(5 * time.Second)),
		rp.WithHTTPClient(httpClient),
		rp.WithCookieHandler(cookieHandler),
	}
	if !provider.DisablePKCE {
		options = append(options, rp.WithPKCE(cookieHandler))
	}
	if !provider.DiscoveryURL.IsNilOrEmpty() {
		options = append(options, rp.WithCustomDiscoveryUrl(provider.DiscoveryURL.String()))
	}

	clientID := provider.ClientID
	clientSecret := provider.ClientSecret
	scopes := provider.Scopes
	if override != nil {
		if len(override.ClientID) > 0 {
			clientID = override.ClientID
		}
		if len(override.ClientSecret) > 0 {
			clientSecret = override.ClientSecret
		}
		if len(override.Scopes) > 0 {
			scopes = override.Scopes
		}
	}
	relyingParty, err := rp.NewRelyingPartyOIDC(
		context.Background(),
		issuer, string(clientID), string(clientSecret),
		redirectURI, scopes, options...,
	)
	if err != nil {
		return nil, err
	}
	return &RelyingPartyWithTokenEndpoint{relyingParty}, nil
}

type oIDCEndpoint struct {
	relyingParty           *RelyingPartyWithTokenEndpoint
	deviceCodeRelyingParty *RelyingPartyWithTokenEndpoint
	clientCredRelyingParty *RelyingPartyWithTokenEndpoint
	jwt                    crypto.JWT
	tokenManagement        tokenManagement
	slugID                 string
	urlParams              map[string]string
	issuer                 string
	svc                    service
}

func newOIDCEndpoint(provider config.OIDCProvider, jwt crypto.JWT, dao user.DAO) (route.Endpoint, error) {
	relyingParty, err := newRelyingParty(provider, nil)
	if err != nil {
		return nil, err
	}
	deviceCodeRelyingParty := relyingParty
	if provider.DeviceCode != nil {
		deviceCodeRelyingParty, err = newRelyingParty(provider, provider.DeviceCode)
		if err != nil {
			return nil, err
		}
	}
	clientCredRelyingParty := relyingParty
	if provider.ClientCredentials != nil {
		clientCredRelyingParty, err = newRelyingParty(provider, provider.ClientCredentials)
		if err != nil {
			return nil, err
		}
	}

	return &oIDCEndpoint{
		relyingParty:           relyingParty,
		deviceCodeRelyingParty: deviceCodeRelyingParty,
		clientCredRelyingParty: clientCredRelyingParty,
		jwt:                    jwt,
		tokenManagement:        tokenManagement{jwt: jwt},
		slugID:                 provider.SlugID,
		urlParams:              provider.URLParams,
		issuer:                 provider.Issuer.String(),
		svc:                    service{dao: dao},
	}, nil
}

func (e *oIDCEndpoint) CollectRoutes(g *route.Group) {
	oidcGroup := g.Group(fmt.Sprintf("/%s/%s", utils.AuthKindOIDC, e.slugID), withOAuthErrorMdw)

	// Add routes for the "Authorization Code" flow
	oidcGroup.GET(fmt.Sprintf("/%s", utils.PathLogin), e.auth, true)
	oidcGroup.GET(fmt.Sprintf("/%s", utils.PathCallback), e.codeExchange, true)

	// Add routes for device code flow and token exchange
	oidcGroup.POST(fmt.Sprintf("/%s", utils.PathDeviceCode), e.deviceCode, true)
	oidcGroup.POST(fmt.Sprintf("/%s", utils.PathToken), e.token, true)
}

// auth is the http handler on Perses side that triggers the "Authorization Code"
// flow to the oauth 2.0 provider.
// It will redirect the user to the provider's "auth" url.
func (e *oIDCEndpoint) auth(ctx echo.Context) error {
	var opts []rp.URLParamOpt
	for key, val := range e.urlParams {
		opts = append(opts, rp.WithURLParam(key, val))
	}
	// If the Redirect URL is not setup by config, we build it from request
	if e.relyingParty.OAuthConfig().RedirectURL == "" {
		opts = append(opts, rp.WithURLParam("redirect_uri", getRedirectURI(ctx.Request(), utils.AuthKindOIDC, e.slugID)))
	}
	codeExchangeHandler := rp.AuthURLHandler(func() string {
		return uuid.New().String()
	}, e.relyingParty, opts...)
	handler := echo.WrapHandler(codeExchangeHandler)
	return handler(ctx)
}

// codeExchange is the http handler on Perses side that will be called back by
// the oauth 2.0 provider during "Authorization Code" flow.
// This handler will then take in charge:
//   - the generation of the oauth 2.0 provider's access token from the code
//     (calling provider's "token" url)
//   - the retrieval of the user information from the token and also requesting the
//     "user infos" url
//   - save the user in database if it's a new user, or update it with the collected information
//   - ultimately, generate a Perses user session with an access and refresh token
func (e *oIDCEndpoint) codeExchange(ctx echo.Context) error {
	marshalUserinfo := func(w http.ResponseWriter, r *http.Request, _ *oidc.Tokens[*oidc.IDTokenClaims], _ string, _ rp.RelyingParty, info *oidcUserInfo) {
		redirectURI := r.URL.Query().Get("redirect_uri")
		if redirectURI == "" {
			redirectURI = "/"
		}

		setCookie := func(cookie *http.Cookie) {
			http.SetCookie(w, cookie)
		}

		if _, err := e.performUserSync(info, setCookie); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			writeResponse(w, []byte(apiinterface.InternalError.Error()))
			return
		}

		http.Redirect(w, r, redirectURI, http.StatusFound)
	}

	var opts []rp.URLParamOpt
	// If the Redirect URL is not setup by config, we build it from request
	if e.relyingParty.OAuthConfig().RedirectURL == "" {
		opts = append(opts, rp.WithURLParam("redirect_uri", getRedirectURI(ctx.Request(), utils.AuthKindOIDC, e.slugID)))
	}
	codeExchangeHandler := rp.CodeExchangeHandler(rp.UserinfoCallback(marshalUserinfo), e.relyingParty, opts...)
	handler := echo.WrapHandler(codeExchangeHandler)
	return handler(ctx)
}

// deviceCode is the http handler on Perses side that will trigger the "Device Authorization"
// flow to the oauth 2.0 provider.
// It will return the provider's DeviceAuthResponse as is, containing some information for the
// user to login in a browser.
// Then the client will be responsible to poll the /{slug_id}/token Perses endpoint to generate
// a proper Perses session.
func (e *oIDCEndpoint) deviceCode(ctx echo.Context) error {
	if e.deviceCodeRelyingParty.GetDeviceAuthorizationEndpoint() == "" {
		e.logWithError(errors.New("device code flow is not supported by this provider"))
		return echo.NewHTTPError(http.StatusNotImplemented, "Device code flow is not supported by this provider")
	}

	// Send the device authorization request
	conf := e.deviceCodeRelyingParty.OAuthConfig()
	resp, err := callDeviceAuthorizationEndpoint(ctx.Request().Context(), e.deviceCodeRelyingParty, &oidc.ClientCredentialsRequest{
		Scope:        conf.Scopes,
		ClientID:     conf.ClientID,
		ClientSecret: conf.ClientSecret,
	})
	if err != nil {
		logrus.WithError(err).Error("Failed to send device authorization request")
		return err
	}

	// Return the device authorization response
	return ctx.JSON(http.StatusOK, resp)
}

// token is the http handler on Perses side that will generate a proper Perses session.
// It is used only in case of device code flow and client credentials flow.
func (e *oIDCEndpoint) token(ctx echo.Context) error {
	var reqBody api.TokenRequest
	if err := ctx.Bind(&reqBody); err != nil {
		e.logWithError(err).Error("Invalid request body")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	var uInfo *oidcUserInfo
	switch reqBody.GrantType {
	case api.GrantTypeDeviceCode:
		resp, err := retrieveDeviceAccessToken(ctx.Request().Context(), e.deviceCodeRelyingParty, reqBody.DeviceCode)
		if err != nil {
			// (We log a warning as the failure means most of the time that the user didn't authorize the app yet)
			e.logWithError(err).Warn("Failed to exchange device code for token")
			return err
		}
		idClaims, err := rp.VerifyTokens[*oidc.IDTokenClaims](ctx.Request().Context(), resp.AccessToken, resp.IDToken, e.deviceCodeRelyingParty.IDTokenVerifier())
		if err != nil {
			e.logWithError(err).Error("Failed to verify token")
			return err
		}
		uInfo, err = rp.Userinfo[*oidcUserInfo](ctx.Request().Context(), resp.AccessToken, resp.TokenType, idClaims.GetSubject(), e.deviceCodeRelyingParty)
		if err != nil {
			e.logWithError(err).Error("Failed to request user info")
			return err
		}
	case api.GrantTypeClientCredentials:
		_, err := e.retrieveClientCredentialsToken(ctx.Request().Context(), reqBody.ClientID, reqBody.ClientSecret)
		if err != nil {
			e.logWithError(err).Error("Failed to exchange client credentials for token")
			return err
		}
		//TODO: Probably not a good idea to use the client id as the subject, but what can we do with client credentials?
		uInfo = &oidcUserInfo{Subject: reqBody.ClientID}
	default:
		return oidc.ErrUnsupportedGrantType()
	}

	resp, err := e.performUserSync(uInfo, ctx.SetCookie)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, resp)
}

// performUserSync performs user synchronization and generates access and refresh tokens.
func (e *oIDCEndpoint) performUserSync(userInfo *oidcUserInfo, setCookie func(cookie *http.Cookie)) (*api.AuthResponse, error) {
	// We don´t forget to set the issuer before making any sync in the database.
	userInfo.issuer = e.issuer

	usr, err := e.svc.syncUser(userInfo)
	if err != nil {
		e.logWithError(err).Error("Failed to sync user in database.")
		return nil, err
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

	return &api.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// retrieveDeviceAccessToken exchanges the device code for an access token,
// from the OAuth 2.0 provider.
// It duplicates the original implementation of OIDC library to make only one query instead of polling.
func retrieveDeviceAccessToken(ctx context.Context, relyingParty *RelyingPartyWithTokenEndpoint, deviceCode string) (*oidc.AccessTokenResponse, error) {
	// Create a new device access token request
	conf := relyingParty.OAuthConfig()
	req := &client.DeviceAccessTokenRequest{
		DeviceAccessTokenRequest: oidc.DeviceAccessTokenRequest{
			GrantType:  oidc.GrantTypeDeviceCode,
			DeviceCode: deviceCode,
		},
		ClientCredentialsRequest: &oidc.ClientCredentialsRequest{
			Scope:        conf.Scopes,
			ClientID:     conf.ClientID,
			ClientSecret: conf.ClientSecret,
		},
	}

	if signer := relyingParty.Signer(); signer != nil {
		assertion, err := client.SignedJWTProfileAssertion(conf.ClientID, []string{relyingParty.Issuer()}, time.Hour, signer)
		if err != nil {
			return nil, fmt.Errorf("failed to build assertion: %w", err)
		}
		req.ClientAssertion = assertion
		req.ClientAssertionType = oidc.ClientAssertionTypeJWTAssertion
	}

	// Call the device access token endpoint
	return client.CallDeviceAccessTokenEndpoint(ctx, req, relyingParty)
}

// retrieveClientCredentialsToken exchanges the client credentials for an access token,
// from the OAuth 2.0 provider.
func (e *oIDCEndpoint) retrieveClientCredentialsToken(ctx context.Context, clientID string, clientSecret string) (*oauth2.Token, error) {
	// Create a new client credentials request
	req := &oidc.ClientCredentialsRequest{
		GrantType:    oidc.GrantTypeClientCredentials,
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Scope:        e.clientCredRelyingParty.OAuthConfig().Scopes,
	}

	// Call the token endpoint
	return callTokenEndpoint(ctx, req, e.clientCredRelyingParty)
}

// callDeviceAuthorizationEndpoint calls the device authorization endpoint of the provider.
// It duplicates the original implementation of OIDC library to have a more flexible response reading.
// An issue has been opened to the oidc library to make the verification_url field also supported.
// https://github.com/zitadel/oidc/issues/565
// TODO: Follow up
func callDeviceAuthorizationEndpoint(ctx context.Context, relyingParty rp.RelyingParty, request *oidc.ClientCredentialsRequest) (*oidc.DeviceAuthorizationResponse, error) {
	req, err := httphelper.FormRequest(ctx, relyingParty.GetDeviceAuthorizationEndpoint(), request, client.Encoder, "")
	if err != nil {
		return nil, err
	}
	if request.ClientSecret != "" {
		req.SetBasicAuth(request.ClientID, request.ClientSecret)
	}

	// Perform the request making sure the verification_url field is also supported.
	// Indeed, Google will return the verification_url field instead of the standard verification_uri one.
	resp := new(struct {
		oidc.DeviceAuthorizationResponse
		VerificationURL string `json:"verification_url"`
	})
	if err := httphelper.HttpRequest(relyingParty.HttpClient(), req, &resp); err != nil {
		return nil, err
	}
	if resp.VerificationURI == "" {
		resp.VerificationURI = resp.VerificationURL
	}
	return &resp.DeviceAuthorizationResponse, nil
}

// callTokenEndpoint calls the token endpoint of the provider.
// It duplicates the original implementation of OIDC library to return the oidc.Error if fails.
// A PR has been opened to the oidc library to modify it on their side
// https://github.com/zitadel/oidc/pull/571
// TODO: Follow up
func callTokenEndpoint(ctx context.Context, request any, caller client.TokenEndpointCaller) (newToken *oauth2.Token, err error) {
	req, err := httphelper.FormRequest(ctx, caller.TokenEndpoint(), request, client.Encoder, nil)
	if err != nil {
		return nil, err
	}

	httpResp, err := caller.HttpClient().Do(req)
	if err != nil {
		return nil, err
	}
	defer httpResp.Body.Close()

	resp := new(struct {
		*oidc.AccessTokenResponse
		*oidc.Error
	})
	if err = json.NewDecoder(httpResp.Body).Decode(resp); err != nil {
		return nil, err
	}

	if httpResp.StatusCode < http.StatusOK || httpResp.StatusCode >= http.StatusBadRequest {
		return nil, resp.Error
	}

	tokenRes := resp.AccessTokenResponse

	token := &oauth2.Token{
		AccessToken:  tokenRes.AccessToken,
		TokenType:    tokenRes.TokenType,
		RefreshToken: tokenRes.RefreshToken,
		Expiry:       time.Now().UTC().Add(time.Duration(tokenRes.ExpiresIn) * time.Second),
	}
	if tokenRes.IDToken != "" {
		token = token.WithExtra(map[string]any{
			"id_token": tokenRes.IDToken,
		})
	}
	return token, nil
}

// logWithError is a little logrus helper to log with the provider slugID.
// example usages:
//
//	logWithError(err).Error("Failed to sync user in database.")
//	logWithError(err).Warn("A warning message")
func (e *oIDCEndpoint) logWithError(err error) *logrus.Entry {
	return logrus.WithError(err).WithField("provider", e.slugID)
}

func writeResponse(w http.ResponseWriter, response []byte) {
	if _, err := w.Write(response); err != nil {
		logrus.WithError(err).Error("error writing http response")
	}
}
