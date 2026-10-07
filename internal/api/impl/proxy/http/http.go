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

// Package httpproxy implements the proxy forwarding the requests to the datasources reachable over HTTP
// (datasource proxy kind "HTTPProxy").
package httpproxy

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"net/http"
	"net/http/httputil"
	"slices"
	"strings"
	"sync"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	"github.com/perses/perses/internal/api/impl/proxy/common"
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

// deniedErrorRecorder is an http.RoundTripper recording the last error due to a destination denied by the guard
// (see netguard.IsDenied).
//
// It is used by the HTTP client given to golang.org/x/oauth2 to request a token (see Proxy.getToken).
// The connection to the token URL is verified by the guard when it's established: a token URL resolving to a denied
// IP address (or redirecting to one) fails with an error matching netguard.IsDenied. This error is kept until the
// HTTP client returns it, but golang.org/x/oauth2 doesn't wrap it: the error of the HTTP client is formatted with %v
// (see "oauth2: cannot fetch token" in golang.org/x/oauth2/internal/token.go), which keeps the message and loses the
// error itself. The denial couldn't be told apart from any other error anymore, and the request would end with a
// 500 Internal Server Error instead of the 403 Forbidden returned for any other denied destination.
//
// The recorder catches the error before golang.org/x/oauth2 does, so getToken can return it as is when the token
// request fails. The other errors are not recorded, and the error of golang.org/x/oauth2 is returned as before.
// The alternatives don't work: matching the error message is fragile, oauth2.RetrieveError only covers the error
// responses of the token endpoint (not the connection errors), and resolving the token URL upfront misses the
// redirections and is subject to DNS rebinding.
//
// This type can be removed if golang.org/x/oauth2 starts wrapping the error of the HTTP client (%w).
type deniedErrorRecorder struct {
	// next is the transport actually sending the requests, verified by the guard (see netguard.Guard.HTTPTransport).
	next http.RoundTripper
	// mutex protects denied. In practice, the token requests (including the redirections and the retry with
	// another authentication style) are sent one after the other, but an http.RoundTripper must be safe for
	// concurrent use.
	mutex sync.Mutex
	// denied is the last error due to a denied destination, nil if there is none.
	denied error
}

func (r *deniedErrorRecorder) RoundTrip(req *http.Request) (*http.Response, error) {
	resp, err := r.next.RoundTrip(req)
	if err != nil && netguard.IsDenied(err) {
		r.mutex.Lock()
		r.denied = err
		r.mutex.Unlock()
	}
	return resp, err
}

// deniedError returns the last error due to a destination denied by the guard, if any.
func (r *deniedErrorRecorder) deniedError() error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	return r.denied
}

// Proxy forwards a request to a datasource reachable over HTTP (datasource proxy kind "HTTPProxy").
// It must be built with New, once per request to forward.
//
// Before forwarding the request, the proxy removes the credentials the caller uses to authenticate against Perses,
// applies the header policies of the datasource and sets up the authentication defined by its secret.
// Every connection it makes (to the datasource, but also to the OAuth token endpoint) is verified by the Guard.
type Proxy struct {
	// Config is the HTTP proxy configuration of the datasource (URL, allowed endpoints, headers...). It is required.
	Config *datasourceHTTP.Config
	// Secret contains the credentials and the TLS config used to reach the datasource. It must already be decrypted.
	// It can be nil.
	Secret *v1.SecretSpec
	// DatasourceName is the name of the datasource, used in the logs and in the error messages.
	DatasourceName string
	// Path is the path of the request on the datasource side. It must start with a '/'.
	Path string
	// Guard verifies every connection made by the proxy. It is required.
	Guard *netguard.Guard
	// TokenRefresher refreshes the OIDC token of the caller when it is missing,
	// for the datasources using the OAuth passthrough. It can be nil.
	TokenRefresher crypto.TokenRefresher
	// Transports caches the HTTP transports of the saved datasources. It can be nil.
	Transports *TransportCache
	// TransportKey identifies the datasource in the transport cache. It is opaque to the proxy.
	// Empty for unsaved datasources: their transport is not cached, and the events they cause are logged at debug level.
	TransportKey string
	// ProxyConfig contains the connection limits and timeouts applied to the transport (datasource.proxy.http).
	// Unset values fall back to their defaults.
	ProxyConfig config.HTTPProxyConfig
	// ForwardCallerAuthorization defines if the Authorization header sent by the caller can be forwarded to the datasource.
	// The zero value (false) is the safe default: the header is removed.
	ForwardCallerAuthorization bool
}

// New returns the Proxy described by p, once verified it holds the settings required to serve requests safely:
// the config of the datasource (with its URL) and the Guard.
func New(p Proxy) (*Proxy, error) {
	if p.Config == nil || p.Config.URL == nil || p.Config.URL.URL == nil {
		return nil, errors.New("the URL of the datasource is missing")
	}
	if p.Guard == nil {
		return nil, errors.New("the guard verifying the connections of the proxy is missing")
	}
	return &p, nil
}

func (h *Proxy) logWithDefaultEntry() *logrus.Entry {
	return logrus.WithFields(map[string]any{
		common.DatasourceFieldLog: h.DatasourceName,
		"url":                     h.Config.URL.String(),
	})
}

// logPolicyEvent logs an event caused by the datasource (e.g. a destination not allowed)
// that is expected to be fixed by the administrator for a saved datasource.
// For an unsaved datasource, the spec comes from the request body: the event is logged at debug level to avoid
// letting any user flood the logs.
func (h *Proxy) logPolicyEvent(entry *logrus.Entry, msg string) {
	if len(h.TransportKey) == 0 {
		entry.Debug(msg)
	} else {
		entry.Warning(msg)
	}
}

// Serve forwards the request of c to the datasource, and writes the response of the datasource to c.
// The response is served under the Perses origin, so the headers that would apply to it are removed or overridden
// (see secureResponse).
func (h *Proxy) Serve(c echo.Context) error {
	req := c.Request()
	res := c.Response()

	isAllowed := false
	for _, allowedEndpoint := range h.Config.AllowedEndpoints {
		if allowedEndpoint.Method == req.Method && len(allowedEndpoint.EndpointPattern.FindAllString(h.Path, -1)) > 0 {
			isAllowed = true
			break
		}
	}

	if len(h.Config.AllowedEndpoints) > 0 && !isAllowed {
		return apiinterface.HandleForbiddenError(fmt.Sprintf("you are not allowed to use this endpoint %q with the HTTP method %s", h.Path, req.Method))
	}

	if err := h.prepareRequest(c); err != nil {
		if netguard.IsDenied(err) {
			h.logPolicyEvent(h.logWithDefaultEntry().WithError(err), "unable to prepare the HTTP request, the destination is not allowed")
			return apiinterface.HandleForbiddenError(deniedDestinationMsg)
		}
		h.logWithDefaultEntry().WithError(err).Error("unable to prepare the HTTP request")
		return err
	}

	// redirect the request to the datasource
	req.URL.Path = h.Path
	h.logWithDefaultEntry().WithField("path", h.Path).Debug("request will be redirected to datasource")

	// Set up the proxy
	var proxyErr error
	reverseProxy := httputil.NewSingleHostReverseProxy(h.Config.URL.URL)
	reverseProxy.ErrorHandler = func(_ http.ResponseWriter, _ *http.Request, err error) {
		if netguard.IsDenied(err) {
			h.logPolicyEvent(h.logWithDefaultEntry().WithError(err), "error proxying, the destination is not allowed")
		} else {
			h.logWithDefaultEntry().WithError(err).Errorf("error proxying, remote unreachable: err=%v", err)
		}
		proxyErr = err
	}
	// The response is served under the Perses origin: the headers that would apply to it are removed or overridden.
	reverseProxy.ModifyResponse = secureResponse
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

func (h *Proxy) prepareRequest(c echo.Context) error {
	req := c.Request()
	// The OAuth passthrough token is stored in the cookies of the caller.
	// It must be retrieved before the caller's credentials are removed from the request.
	var oauthPassthroughToken string
	if h.Config.OauthPassthrough {
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
	req.Host = h.Config.URL.Host
	// Fix header
	if len(req.Header.Get(echo.HeaderXRealIP)) == 0 {
		req.Header.Set(echo.HeaderXRealIP, c.RealIP())
	}
	if len(req.Header.Get(echo.HeaderXForwardedProto)) == 0 {
		req.Header.Set(echo.HeaderXForwardedProto, c.Scheme())
	}
	// set header according to the configuration
	if len(h.Config.Headers) > 0 {
		for k, v := range h.Config.Headers {
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
				logrus.Infof("Datasource %s has Authorization header in its configuration. This is not allowed and will be ignored. Use Secret object to set Authorization header.", h.DatasourceName)
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
func (h *Proxy) removeCallerCredentials(headers http.Header) {
	// Cookies sent by the client are scoped to the Perses origin, and so they are never meant for the datasource.
	// They contain the Perses session (access and refresh tokens) and possibly the tokens of the OIDC/OAuth provider.
	headers.Del(echo.HeaderCookie)
	if !h.ForwardCallerAuthorization {
		headers.Del(echo.HeaderAuthorization)
	}
}

// filterHeaders applies the policy after configured headers have been set, just before authentication have been added.
func (h *Proxy) filterHeaders(headers http.Header) {
	isAllowed := func(name string) bool {
		matches := func(header string) bool { return strings.EqualFold(header, name) }
		if len(h.Config.AllowHeaders) > 0 {
			return slices.ContainsFunc(h.Config.AllowHeaders, matches)
		}
		return !slices.ContainsFunc(h.Config.DropHeaders, matches)
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
func (h *Proxy) setupAuthentication(req *http.Request, oauthPassthroughToken string) error {
	if h.Config.OauthPassthrough {
		req.Header.Set(echo.HeaderAuthorization, fmt.Sprintf("Bearer %s", oauthPassthroughToken))
		return nil
	}

	if h.Secret == nil {
		return nil
	}

	basicAuth := h.Secret.BasicAuth
	if basicAuth != nil {
		password, err := basicAuth.GetPassword()
		if err != nil {
			return err
		}
		req.SetBasicAuth(basicAuth.Username, password)
	}
	authz := h.Secret.Authorization
	if authz != nil {
		credential, err := authz.GetCredentials()
		if err != nil {
			return err
		}
		req.Header.Set(echo.HeaderAuthorization, fmt.Sprintf("%s %s", authz.Type, credential))
	}
	oauth := h.Secret.OAuth
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
func (h *Proxy) getOAuthPassthroughToken(c echo.Context) (string, error) {
	var token string
	if oidcCookie, err := c.Cookie(crypto.CookieKeyOIDCToken); err == nil {
		token = oidcCookie.Value
	}
	if len(token) == 0 && h.TokenRefresher != nil {
		// OIDC token cookie is missing. It may have expired while the Perses session
		// was still valid. Attempt to refresh using the stored OIDC refresh token
		// before giving up.
		// The refreshed token is only set in the cookies of the response,
		// so we must use the token returned by the refresher for the current request.
		if _, refreshErr := c.Cookie(crypto.CookieKeyOIDCRefreshToken); refreshErr == nil {
			token = h.TokenRefresher(c)
		}
	}
	if len(token) == 0 {
		return "", apiinterface.HandleBadRequestError(fmt.Sprintf(
			"you are querying datasource %q which is configured to use OAuthPassThrough, but no OAuth token is available in this session; try logging out and logging in again with the correct authentication provider",
			h.DatasourceName,
		))
	}
	return token, nil
}

// getToken exchanges the client credentials for an access token,
// from the OAuth 2.0 provider.
func (h *Proxy) getToken(ctx context.Context, oauth *secretModel.OAuth) (*oauth2.Token, error) {
	// The token URL comes from the secret, which could have been stored before the policy was enforced or changed.
	// The connection is verified by the transport anyway, this provides an early and clear error.
	if err := h.Guard.ValidateOAuth(oauth); err != nil {
		return nil, err
	}
	transport, err := h.getTransport()
	if err != nil {
		return nil, err
	}

	// The recorder keeps the error of a connection denied by the guard, as golang.org/x/oauth2 doesn't wrap it
	// (see deniedErrorRecorder).
	recorder := &deniedErrorRecorder{next: transport}
	httpClient := &http.Client{
		Transport: recorder,
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
		if deniedErr := recorder.deniedError(); deniedErr != nil {
			return nil, fmt.Errorf("failed to get token: %w", deniedErr)
		}
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
func (h *Proxy) getTransport() (*http.Transport, error) {
	if h.Transports == nil || len(h.TransportKey) == 0 {
		return h.prepareTransport()
	}
	settings := transportSettings{ConnectTimeout: h.ProxyConfig.EffectiveTimeout(h.Config.Timeout)}
	if h.Secret != nil {
		settings.TLSConfig = h.Secret.TLSConfig
	}
	return h.Transports.get(h.TransportKey, settings, h.prepareTransport)
}

func (h *Proxy) prepareTransport() (*http.Transport, error) {
	tlsConfig, err := h.prepareTLSConfig()
	if err != nil {
		h.logWithDefaultEntry().WithError(err).Error("unable to build the tls config")
		return nil, echo.NewHTTPError(http.StatusBadGateway, "unable build the tls config")
	}
	// The datasource can only lower the timeout set by the server (datasource.proxy.http.default_timeout and max_timeout).
	// The timeout is clamped here again, even though it is validated when the datasource is saved,
	// because the maximum can have been lowered since then, and because unsaved datasources are not validated.
	connectTimeout := h.ProxyConfig.EffectiveTimeout(h.Config.Timeout)
	if timeoutErr := h.ProxyConfig.ValidateTimeout(h.Config.Timeout); timeoutErr != nil {
		entry := h.logWithDefaultEntry().WithError(timeoutErr)
		const msg = "the timeout of the datasource is not allowed by the server configuration, %s is used instead"
		if len(h.TransportKey) == 0 {
			// Unsaved datasource: it is not validated, and its transport is built for each request.
			// Logging at debug level avoids letting any user flood the logs.
			entry.Debugf(msg, connectTimeout)
		} else {
			// Saved datasource: the maximum has been lowered after the datasource has been saved.
			// It is logged once per transport build (see TransportCache).
			entry.Warningf(msg, connectTimeout)
		}
	}
	// Every connection (including the ones to the OAuth token endpoint and the redirections it follows) is verified by the guard.
	transport := h.Guard.HTTPTransport(tlsConfig, connectTimeout)
	// The transport is reused across requests (see TransportCache), and there is one transport per datasource.
	// A dashboard usually sends many queries in parallel to the same datasource,
	// so keep more idle connections than the Go default (2 per host) to actually reuse them.
	// Configured with datasource.proxy.http.max_idle_conns and datasource.proxy.http.max_idle_conns_per_host.
	transport.MaxIdleConns = h.ProxyConfig.MaxIdleConns
	transport.MaxIdleConnsPerHost = h.ProxyConfig.MaxIdleConnsPerHost
	// Limit the connections opened to the datasource (configured with datasource.proxy.http.max_conns_per_host).
	// Once reached, requests wait for a connection to be available. Zero means no limit.
	transport.MaxConnsPerHost = h.ProxyConfig.MaxConnsPerHost
	return transport, nil
}

func (h *Proxy) prepareTLSConfig() (*tls.Config, error) {
	if h.Secret == nil {
		return &tls.Config{MinVersion: tls.VersionTLS12, MaxVersion: tls.VersionTLS13}, nil
	}
	return h.Secret.TLSConfig.BuildTLSConfig()
}
