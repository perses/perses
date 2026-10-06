// Copyright The Perses Authors
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

package proxy

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"slices"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/netguard"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
	"github.com/sirupsen/logrus"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"
)

type httpProxy struct {
	config         *datasourceHTTP.Config
	secret         *v1.SecretSpec
	datasourceName string
	path           string
	// guard verifies every connection made by the proxy. It must not be nil.
	guard          *netguard.Guard
	tokenRefresher crypto.TokenRefresher
	// transports caches the HTTP transports of the saved datasources. It can be nil.
	transports *transportCache
	// transportKey identifies the datasource in the transport cache. Empty for unsaved datasources.
	transportKey string
	// proxyConfig contains the connection limits and timeouts applied to the transport (datasource.proxy.http).
	// Unset values fall back to their defaults.
	proxyConfig config.HTTPProxyConfig
	// forwardCallerAuthorization defines if the Authorization header sent by the caller can be forwarded to the datasource.
	// The zero value (false) is the safe default: the header is removed.
	forwardCallerAuthorization bool
}

func (h *httpProxy) logWithDefaultEntry() *logrus.Entry {
	return logrus.WithFields(map[string]interface{}{
		datasourceFieldLog: h.datasourceName,
		"url":              h.config.URL.String(),
	})
}

func (h *httpProxy) serve(c echo.Context) error {
	req := c.Request()
	res := c.Response()

	isAllowed := false
	for _, allowedEndpoint := range h.config.AllowedEndpoints {
		if allowedEndpoint.Method == req.Method && len(allowedEndpoint.EndpointPattern.FindAllString(h.path, -1)) > 0 {
			isAllowed = true
			break
		}
	}

	if len(h.config.AllowedEndpoints) > 0 && !isAllowed {
		return apiinterface.HandleForbiddenError(fmt.Sprintf("you are not allowed to use this endpoint %q with the HTTP method %s", h.path, req.Method))
	}

	if err := h.prepareRequest(c); err != nil {
		h.logWithDefaultEntry().WithError(err).Error("unable to prepare the HTTP request")
		if netguard.IsDenied(err) {
			return apiinterface.HandleForbiddenError(deniedDestinationMsg)
		}
		return err
	}

	// redirect the request to the datasource
	req.URL.Path = h.path
	h.logWithDefaultEntry().WithField("path", h.path).Debug("request will be redirected to datasource")

	// Set up the proxy
	var proxyErr error
	reverseProxy := httputil.NewSingleHostReverseProxy(h.config.URL.URL)
	reverseProxy.ErrorHandler = func(_ http.ResponseWriter, _ *http.Request, err error) {
		h.logWithDefaultEntry().WithError(err).Errorf("error proxying, remote unreachable: err=%v", err)
		proxyErr = err
	}
	reverseProxy.ModifyResponse = h.sanitizeLocationHeaders
	// use a dedicated HTTP transport to avoid any TLS encryption issues
	var transportErr error
	reverseProxy.Transport, transportErr = h.getTransport()
	if transportErr != nil {
		return transportErr
	}
	// Reverse proxy request.
	reverseProxy.ServeHTTP(res, req)
	// Return any error handled during proxying request.
	if proxyErr != nil {
		if netguard.IsDenied(proxyErr) {
			// The details (like the resolved IP address) are only logged, to not leak information about the internal network.
			return apiinterface.HandleForbiddenError(deniedDestinationMsg)
		}
		// we need to wrap the error with an Echo Error,
		// otherwise the error will be hidden by the middleware "middleware.HandleError".
		status := res.Status
		if status < 400 {
			// if there is an error and the status code doesn't match the error, then let's use a default one
			status = 500
		}
		return echo.NewHTTPError(status, proxyErr.Error())
	}
	return nil
}

const deniedDestinationMsg = "the datasource destination is not allowed by the Perses server configuration ('datasource.proxy')"

// locationHeaders are the response headers containing a URL the browser can follow or use to resolve other URLs:
// "Location" for the redirections (and the created resources), "Content-Location" for the location of the returned content.
var locationHeaders = []string{"Location", "Content-Location"}

// sanitizeLocationHeaders removes the location headers (see locationHeaders) pointing to another origin than the datasource.
// The proxy never follows the redirections itself, but the browser does. Without this, the proxy could be used as an
// open redirect from the Perses domain to any website.
func (h *httpProxy) sanitizeLocationHeaders(resp *http.Response) error {
	for _, header := range locationHeaders {
		values := resp.Header.Values(header)
		if len(values) == 0 {
			continue
		}
		for _, value := range values {
			if !isSameOriginLocation(value, h.config.URL.URL) {
				h.logWithDefaultEntry().WithField(strings.ToLower(header), value).Warningf("dropping the %s header pointing to another origin", header)
				resp.Header.Del(header)
				break
			}
		}
	}
	return nil
}

func (h *httpProxy) prepareRequest(c echo.Context) error {
	req := c.Request()
	// The OAuth passthrough token is stored in the cookies of the caller.
	// It must be retrieved before the caller's credentials are removed from the request.
	var oauthPassthroughToken string
	if h.config.OauthPassthrough {
		token, err := h.getOAuthPassthroughToken(c)
		if err != nil {
			return err
		}
		oauthPassthroughToken = token
	}
	h.removeCallerCredentials(req.Header)
	// We have to modify the HOST of the request to match the host of the targetURL
	// So far I'm not sure to understand exactly why. However, if you are going to remove it, be sure of what you are doing.
	// It has been done to fix an error returned by Openshift itself saying the target doesn't exist.
	// Since we are using HTTP/1, setting the HOST is setting also a header, so if the host and the header are different,
	// then maybe it is blocked by the Openshift router.
	req.Host = h.config.URL.Host
	// Fix header
	if len(req.Header.Get(echo.HeaderXRealIP)) == 0 {
		req.Header.Set(echo.HeaderXRealIP, c.RealIP())
	}
	if len(req.Header.Get(echo.HeaderXForwardedProto)) == 0 {
		req.Header.Set(echo.HeaderXForwardedProto, c.Scheme())
	}
	// set header according to the configuration
	if len(h.config.Headers) > 0 {
		for k, v := range h.config.Headers {
			// Header names are case-insensitive, and req.Header.Set canonicalizes them (e.g. "authorization" becomes "Authorization").
			// The comparison must be case-insensitive as well, otherwise the check could be bypassed.
			if strings.EqualFold(k, echo.HeaderAuthorization) {
				// Authorization header cannot be overwritten by the public configuration.
				// It must be set using the Secret configuration.
				// It will avoid leaking credentials and user to be able to set them directly in the datasource configuration.
				//
				// The verification is not done during the validation of the datasource configuration because this is up to the Observability vendor to decide how it wants to manage its datasource configuration.
				// For Perses, we don't want to allow users to set the Authorization header directly in the datasource configuration because we have created a dedicated object to handle sensitive information: the Secret.
				// But other vendors might have different policies about it and might want to allow it.
				logrus.Infof("Datasource %s has Authorization header in its configuration. This is not allowed and will be ignored. Use Secret object to set Authorization header.", h.datasourceName)
				continue
			}
			req.Header.Set(k, v)
		}
	}
	h.filterHeaders(req.Header)
	return h.setupAuthentication(req, oauthPassthroughToken)
}

// removeCallerCredentials removes from the request the credentials used by the caller to authenticate against Perses.
// These credentials must never reach the datasource: anyone controlling or observing the datasource would be able to
// reuse them to impersonate the caller (e.g. by replaying the refresh token against the Perses API).
// It must be called before the headers coming from the datasource configuration are set,
// so a datasource can still explicitly define its own Cookie header.
func (h *httpProxy) removeCallerCredentials(headers http.Header) {
	// Cookies sent by the client are scoped to the Perses origin, and so they are never meant for the datasource.
	// They contain the Perses session (access and refresh tokens) and possibly the tokens of the OIDC/OAuth provider.
	headers.Del(echo.HeaderCookie)
	if !h.forwardCallerAuthorization {
		headers.Del(echo.HeaderAuthorization)
	}
}

// filterHeaders applies the policy after configured headers have been set, just before authentication have been added.
func (h *httpProxy) filterHeaders(headers http.Header) {
	isAllowed := func(name string) bool {
		matches := func(header string) bool { return strings.EqualFold(header, name) }
		if len(h.config.AllowHeaders) > 0 {
			return slices.ContainsFunc(h.config.AllowHeaders, matches)
		}
		return !slices.ContainsFunc(h.config.DropHeaders, matches)
	}
	for name := range headers {
		if !isAllowed(name) {
			delete(headers, name)
		}
	}
	if !isAllowed(echo.HeaderXForwardedFor) {
		// A nil value tells ReverseProxy not to add X-Forwarded-For again.
		headers[echo.HeaderXForwardedFor] = nil
	}
}

// setupAuthentication sets the credentials used to authenticate against the datasource.
// oauthPassthroughToken is only used when the OAuth passthrough is enabled in the datasource configuration.
func (h *httpProxy) setupAuthentication(req *http.Request, oauthPassthroughToken string) error {
	if h.config.OauthPassthrough {
		req.Header.Set(echo.HeaderAuthorization, fmt.Sprintf("Bearer %s", oauthPassthroughToken))
		return nil
	}

	if h.secret == nil {
		return nil
	}

	basicAuth := h.secret.BasicAuth
	if basicAuth != nil {
		password, err := basicAuth.GetPassword()
		if err != nil {
			return err
		}
		req.SetBasicAuth(basicAuth.Username, password)
	}
	authz := h.secret.Authorization
	if authz != nil {
		credential, err := authz.GetCredentials()
		if err != nil {
			return err
		}
		req.Header.Set(echo.HeaderAuthorization, fmt.Sprintf("%s %s", authz.Type, credential))
	}
	oauth := h.secret.OAuth
	if oauth != nil {
		token, err := h.getToken(req.Context(), oauth)
		if err != nil {
			return err
		}
		req.Header.Set(echo.HeaderAuthorization, fmt.Sprintf("Bearer %s", token.AccessToken))
	}

	return nil
}

// getOAuthPassthroughToken returns the OIDC/OAuth token of the caller, stored in its cookies.
// If the token is missing (or empty), it tries to refresh it using the OIDC refresh token also stored in the cookies.
func (h *httpProxy) getOAuthPassthroughToken(c echo.Context) (string, error) {
	var token string
	if oidcCookie, err := c.Cookie(crypto.CookieKeyOIDCToken); err == nil {
		token = oidcCookie.Value
	}
	if len(token) == 0 && h.tokenRefresher != nil {
		// OIDC token cookie is missing. It may have expired while the Perses session
		// was still valid. Attempt to refresh using the stored OIDC refresh token
		// before giving up.
		// The refreshed token is only set in the cookies of the response,
		// so we must use the token returned by the refresher for the current request.
		if _, refreshErr := c.Cookie(crypto.CookieKeyOIDCRefreshToken); refreshErr == nil {
			token = h.tokenRefresher(c)
		}
	}
	if len(token) == 0 {
		return "", apiinterface.HandleBadRequestError(fmt.Sprintf(
			"you are querying datasource %q which is configured to use OAuthPassThrough, but no OAuth token is available in this session; try logging out and logging in again with the correct authentication provider",
			h.datasourceName,
		))
	}
	return token, nil
}

// getToken exchanges the client credentials for an access token,
// from the OAuth 2.0 provider.
func (h *httpProxy) getToken(ctx context.Context, oauth *secretModel.OAuth) (*oauth2.Token, error) {
	// The token URL comes from the secret, which could have been stored before the policy was enforced or changed.
	// The connection is verified by the transport anyway, this provides an early and clear error.
	if err := h.guard.ValidateOAuth(oauth); err != nil {
		return nil, err
	}
	transport, err := h.getTransport()
	if err != nil {
		return nil, err
	}

	httpClient := &http.Client{
		Transport: transport,
	}

	// add our http client with tls config
	newCtx := context.WithValue(ctx, oauth2.HTTPClient, httpClient)

	clientSecret, err := oauth.GetClientSecret()
	if err != nil {
		return nil, fmt.Errorf("unable to get client secret: %s", err)
	}

	// Create a new client credentials Config
	conf := &clientcredentials.Config{
		ClientID:       oauth.ClientID,
		ClientSecret:   clientSecret,
		TokenURL:       oauth.TokenURL,
		Scopes:         oauth.Scopes,
		EndpointParams: oauth.EndpointParams,
		AuthStyle:      oauth2.AuthStyle(oauth.AuthStyle),
	}

	// Use the Token method to retrieve the token
	token, err := conf.Token(newCtx)
	if err != nil {
		return nil, fmt.Errorf("failed to get token: %w", err)
	}

	if !token.Valid() {
		// APIs like GitHub might return an invalid token without error
		return nil, errors.New("invalid token received")
	}

	return token, err
}

// getTransport returns the transport to reach the datasource.
// For a saved datasource, the transport is cached so the connections are reused across requests.
// For an unsaved datasource, a new transport is built for each request.
func (h *httpProxy) getTransport() (*http.Transport, error) {
	if h.transports == nil || len(h.transportKey) == 0 {
		return h.prepareTransport()
	}
	settings := transportSettings{ConnectTimeout: h.proxyConfig.EffectiveTimeout(h.config.Timeout)}
	if h.secret != nil {
		settings.TLSConfig = h.secret.TLSConfig
	}
	return h.transports.get(h.transportKey, settings, h.prepareTransport)
}

func (h *httpProxy) prepareTransport() (*http.Transport, error) {
	tlsConfig, err := h.prepareTLSConfig()
	if err != nil {
		h.logWithDefaultEntry().WithError(err).Error("unable to build the tls config")
		return nil, echo.NewHTTPError(http.StatusBadGateway, "unable build the tls config")
	}
	// The datasource can only lower the timeout set by the server (datasource.proxy.http.default_timeout and max_timeout).
	// The timeout is clamped here again, even though it is validated when the datasource is saved,
	// because the maximum can have been lowered since then, and because unsaved datasources are not validated.
	connectTimeout := h.proxyConfig.EffectiveTimeout(h.config.Timeout)
	if timeoutErr := h.proxyConfig.ValidateTimeout(h.config.Timeout); timeoutErr != nil {
		entry := h.logWithDefaultEntry().WithError(timeoutErr)
		const msg = "the timeout of the datasource is not allowed by the server configuration, %s is used instead"
		if len(h.transportKey) == 0 {
			// Unsaved datasource: it is not validated, and its transport is built for each request.
			// Logging at debug level avoids letting any user flood the logs.
			entry.Debugf(msg, connectTimeout)
		} else {
			// Saved datasource: the maximum has been lowered after the datasource has been saved.
			// It is logged once per transport build (see transportCache).
			entry.Warningf(msg, connectTimeout)
		}
	}
	// Every connection (including the ones to the OAuth token endpoint and the redirections it follows) is verified by the guard.
	transport := h.guard.HTTPTransport(tlsConfig, connectTimeout)
	// The transport is reused across requests (see transportCache), and there is one transport per datasource.
	// A dashboard usually sends many queries in parallel to the same datasource,
	// so keep more idle connections than the Go default (2 per host) to actually reuse them.
	// Configured with datasource.proxy.http.max_idle_conns and datasource.proxy.http.max_idle_conns_per_host.
	transport.MaxIdleConns = h.proxyConfig.MaxIdleConns
	transport.MaxIdleConnsPerHost = h.proxyConfig.MaxIdleConnsPerHost
	// Limit the connections opened to the datasource (configured with datasource.proxy.http.max_conns_per_host).
	// Once reached, requests wait for a connection to be available. Zero means no limit.
	transport.MaxConnsPerHost = h.proxyConfig.MaxConnsPerHost
	return transport, nil
}

func (h *httpProxy) prepareTLSConfig() (*tls.Config, error) {
	if h.secret == nil {
		return &tls.Config{MinVersion: tls.VersionTLS12, MaxVersion: tls.VersionTLS13}, nil
	}
	return h.secret.TLSConfig.BuildTLSConfig()
}

// isSameOriginLocation returns true if the location (absolute or relative) stays on the origin (scheme, host and port)
// of the target.
func isSameOriginLocation(location string, target *url.URL) bool {
	// Browsers ignore tabs and newlines in a URL, and consider backslashes as slashes ("/\evil.com" is "//evil.com").
	normalized := strings.NewReplacer("\t", "", "\r", "", "\n", "", "\\", "/").Replace(strings.TrimSpace(location))
	u, err := url.Parse(normalized)
	if err != nil {
		return false
	}
	if len(u.Scheme) == 0 && len(u.Host) == 0 {
		// Relative location. Browsers consider "///evil.com" as "//evil.com".
		return !strings.HasPrefix(normalized, "//")
	}
	scheme := strings.ToLower(u.Scheme)
	if len(scheme) == 0 {
		// Scheme-relative location ("//host/path").
		scheme = strings.ToLower(target.Scheme)
	}
	if scheme != strings.ToLower(target.Scheme) {
		return false
	}
	return strings.EqualFold(u.Hostname(), target.Hostname()) && effectivePort(scheme, u) == effectivePort(scheme, target)
}

// effectivePort returns the port of the URL, or the default port of the scheme when the URL doesn't define any.
func effectivePort(scheme string, u *url.URL) string {
	if port := u.Port(); len(port) > 0 {
		return port
	}
	switch scheme {
	case "http":
		return "80"
	case "https":
		return "443"
	default:
		return ""
	}
}
