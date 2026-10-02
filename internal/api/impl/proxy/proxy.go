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
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/go-sql-driver/mysql"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	"github.com/perses/perses/internal/api/crypto"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/globalsecret"
	"github.com/perses/perses/internal/api/interface/v1/secret"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/secretfile"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	datasourcev1 "github.com/perses/perses/pkg/model/api/v1/datasource"
	"github.com/perses/perses/pkg/model/api/v1/role"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
	datasourceSpec "github.com/perses/spec/go/datasource"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
	datasourceSQL "github.com/perses/spec/go/datasource/proxy/sql"
	"github.com/sirupsen/logrus"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"
)

const (
	datasourceFieldLog = "datasource"
	projectFieldLog    = "project"
)

// projectForLog returns a meaningful log value for the project field.
// For global datasources (where project is empty), it returns "<global>" to make logs clearer.
func projectForLog(project string) string {
	if project == "" {
		return "<global>"
	}
	return project
}

var _ = json.Unmarshaler(&unsavedProxyBody{})

// unsavedProxyBody is the body of the request when the datasource is not saved yet.
// It contains the body of the request and the datasource spec, which is used to build the proxy rather than
// retrieving the datasource from the database.
type unsavedProxyBody struct {
	Method string              `json:"method" yaml:"method"`
	Body   []byte              `json:"body,omitempty" yaml:"body"`
	Spec   datasourceSpec.Spec `json:"spec" yaml:"spec"`
}

func (u *unsavedProxyBody) UnmarshalJSON(data []byte) error {
	type Alias unsavedProxyBody
	aux := Alias{}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	if aux.Method == "" {
		return fmt.Errorf("missing field 'method'")
	}

	if aux.Method != http.MethodGet && aux.Method != http.MethodPost && aux.Method != http.MethodPut && aux.Method != http.MethodDelete {
		return fmt.Errorf("invalid method %q", aux.Method)
	}

	if _, _, err := datasourcev1.ValidateAndExtract(aux.Spec.Plugin.Spec); err != nil {
		return fmt.Errorf("invalid config: %w", err)
	}

	*u = unsavedProxyBody(aux)
	return nil
}

func (u *unsavedProxyBody) setRequestParams(ctx echo.Context) {
	req := ctx.Request()
	req.Method = u.Method

	if len(u.Body) > 0 {
		req.Body = io.NopCloser(strings.NewReader(string(u.Body)))
	} else {
		req.Body = nil
	}

	req.ContentLength = int64(len(u.Body))

	ctx.SetRequest(req)
}

const unsavedDatasourceDefaultName = "unsaved-datasource"

type endpoint struct {
	cfg            config.DatasourceConfig
	dashboard      dashboard.DAO
	secret         secret.DAO
	globalSecret   globalsecret.DAO
	dts            datasource.DAO
	globalDTS      globaldatasource.DAO
	crypto         crypto.Crypto
	fileValidator  *secretfile.Validator
	authz          authorization.Authorization
	tokenRefresher crypto.TokenRefresher
	transports     *transportCache
}

func New(cfg config.DatasourceConfig, dashboardDAO dashboard.DAO, secretDAO secret.DAO, globalSecretDAO globalsecret.DAO,
	dtsDAO datasource.DAO, globalDtsDAO globaldatasource.DAO, crypto crypto.Crypto, fileValidator *secretfile.Validator,
	authz authorization.Authorization, tokenRefresher crypto.TokenRefresher) route.Endpoint {
	return &endpoint{
		cfg:            cfg,
		dashboard:      dashboardDAO,
		secret:         secretDAO,
		globalSecret:   globalSecretDAO,
		dts:            dtsDAO,
		globalDTS:      globalDtsDAO,
		crypto:         crypto,
		fileValidator:  fileValidator,
		authz:          authz,
		tokenRefresher: tokenRefresher,
		transports:     newTransportCache(),
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	if !e.cfg.Global.Disable {
		g.ANY(fmt.Sprintf("/%s/:%s/*", utils.PathGlobalDatasource, utils.ParamName), e.proxySavedGlobalDatasource, false)
		// allow direct datasource queries without extra path (e.g., from ClickHouse)
		g.ANY(fmt.Sprintf("/%s/:%s", utils.PathGlobalDatasource, utils.ParamName), e.proxySavedGlobalDatasource, false)

		g.POST(fmt.Sprintf("/%s/%s/*", utils.PathUnsaved, utils.PathGlobalDatasource), e.proxyUnsavedGlobalDatasource, false)
	}
	if !e.cfg.Project.Disable {
		g.ANY(fmt.Sprintf("/%s/:%s/%s/:%s/*", utils.PathProject, utils.ParamProject, utils.PathDatasource, utils.ParamName), e.proxySavedProjectDatasource, false)
		// allow direct datasource queries without extra path (e.g., from ClickHouse)
		g.ANY(fmt.Sprintf("/%s/:%s/%s/:%s", utils.PathProject, utils.ParamProject, utils.PathDatasource, utils.ParamName), e.proxySavedProjectDatasource, false)

		g.POST(fmt.Sprintf("/%s/%s/:%s/%s/*", utils.PathUnsaved, utils.PathProject, utils.ParamProject, utils.PathDatasource), e.proxyUnsavedProjectDatasource, false)
	}
	if !e.cfg.DisableLocal {
		g.ANY(fmt.Sprintf("/%s/:%s/%s/:%s/%s/:%s/*", utils.PathProject, utils.ParamProject, utils.PathDashboard, utils.ParamDashboard, utils.PathDatasource, utils.ParamName), e.proxySavedDashboardDatasource, false)
		// allow direct datasource queries without extra path (e.g., from ClickHouse)
		g.ANY(fmt.Sprintf("/%s/:%s/%s/:%s/%s/:%s", utils.PathProject, utils.ParamProject, utils.PathDashboard, utils.ParamDashboard, utils.PathDatasource, utils.ParamName), e.proxySavedDashboardDatasource, false)

		g.POST(fmt.Sprintf("/%s/%s/:%s/%s/:%s/%s/*", utils.PathUnsaved, utils.PathProject, utils.ParamProject, utils.PathDashboard, utils.ParamDashboard, utils.PathDatasource), e.proxyUnsavedDashboardDatasource, false)
	}
}

func (e *endpoint) checkPermission(ctx echo.Context, projectName string, scope role.Scope, action role.Action) error {
	if !e.authz.IsEnabled() {
		return nil
	}

	if role.IsGlobalScope(scope) {
		if ok := e.authz.HasPermission(ctx, action, v1.WildcardProject, scope); !ok {
			return apiinterface.HandleForbiddenError(fmt.Sprintf("missing '%s' global permission for '%s' kind", action, scope))
		}
		return nil
	}

	if ok := e.authz.HasPermission(ctx, action, projectName, scope); !ok {
		return apiinterface.HandleForbiddenError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", action, projectName, scope))
	}

	return nil
}

type proxy interface {
	serve(c echo.Context) error
}

// newProxy builds the proxy matching the kind of the datasource.
// transportKey identifies the saved datasource in the transport cache. It must be empty for unsaved datasources,
// so their (one-off) transport is not cached.
func (e *endpoint) newProxy(datasourceName, projectName, transportKey string, spec datasourceSpec.Spec, path string,
	retrieveSecret func(name string) (*v1.SecretSpec, error)) (proxy, error) {
	cfg, kind, err := datasourcev1.ValidateAndExtract(spec.Plugin.Spec)
	if err != nil {
		logrus.WithError(err).WithFields(map[string]interface{}{
			datasourceFieldLog: datasourceName,
			projectFieldLog:    projectForLog(projectName),
		}).Error("unable to build or find the config in the datasource spec")
		return nil, echo.NewHTTPError(http.StatusBadGateway, "unable to build or find the config")
	}

	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}

	loadSecret := func(name string) (*v1.SecretSpec, error) {
		scrt, retrieveErr := retrieveSecret(name)
		if retrieveErr != nil {
			return nil, retrieveErr
		}
		if _, decryptErr := e.crypto.Decrypt(scrt); decryptErr != nil {
			logrus.WithError(decryptErr).WithFields(map[string]interface{}{
				datasourceFieldLog: datasourceName,
				projectFieldLog:    projectForLog(projectName),
			}).Error("unable to decrypt the datasource secret")
			return nil, apiinterface.InternalError
		}
		// Defense in depth: the secret might have been stored before the file restriction was enforced
		// (or the allowed directories changed since). Never read a file that is not explicitly allowed.
		if validateErr := e.fileValidator.ValidateSpec(scrt); validateErr != nil {
			logrus.WithError(validateErr).WithFields(map[string]interface{}{
				datasourceFieldLog: datasourceName,
				projectFieldLog:    projectForLog(projectName),
			}).Warning("the datasource secret references a file that is not allowed")
			return nil, apiinterface.HandleForbiddenError(fmt.Sprintf("secret %q references a file that is not allowed", name))
		}
		return scrt, nil
	}

	var scrt *v1.SecretSpec

	switch kind {
	case datasourceHTTP.ProxyKindName:
		httpConfig := cfg.(*datasourceHTTP.Config)
		if len(httpConfig.Secret) > 0 {
			scrt, err = loadSecret(httpConfig.Secret)
			if err != nil {
				return nil, err
			}
		}
		return &httpProxy{
			config:         httpConfig,
			datasourceName: datasourceName,
			path:           path,
			secret:         scrt,
			tokenRefresher: e.tokenRefresher,
			transports:     e.transports,
			transportKey:   transportKey,
			proxyConfig:    e.cfg.HTTPProxy,
		}, nil
	case datasourceSQL.ProxyKindName:
		sqlConfig := cfg.(*datasourceSQL.Config)
		if len(sqlConfig.Secret) > 0 {
			scrt, err = loadSecret(sqlConfig.Secret)
			if err != nil {
				return nil, err
			}
		}
		return &sqlProxy{
			config:  sqlConfig,
			name:    datasourceName,
			project: projectName,
			path:    path,
			secret:  scrt,
		}, nil
	default:
		return nil, errors.New("no proxy kind found")
	}
}

type httpProxy struct {
	config         *datasourceHTTP.Config
	secret         *v1.SecretSpec
	datasourceName string
	path           string
	tokenRefresher crypto.TokenRefresher
	// transports caches the HTTP transports of the saved datasources. It can be nil.
	transports *transportCache
	// transportKey identifies the datasource in the transport cache. Empty for unsaved datasources.
	transportKey string
	// proxyConfig contains the connection limits and timeouts applied to the transport (datasource.http_proxy).
	// Unset values fall back to their defaults.
	proxyConfig config.HTTPProxyConfig
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

	allowPath := pathForAllowlist(h.path)
	isAllowed := false
	for _, allowedEndpoint := range h.config.AllowedEndpoints {
		if allowedEndpoint.Method == req.Method && len(allowedEndpoint.EndpointPattern.FindAllString(allowPath, -1)) > 0 {
			isAllowed = true
			break
		}
	}
	// Also accept explicit allow of query_range_batch if configured.
	if !isAllowed && isQueryRangeBatchPath(h.path) {
		for _, allowedEndpoint := range h.config.AllowedEndpoints {
			if allowedEndpoint.Method == req.Method && len(allowedEndpoint.EndpointPattern.FindAllString(h.path, -1)) > 0 {
				isAllowed = true
				break
			}
		}
	}

	if len(h.config.AllowedEndpoints) > 0 && !isAllowed {
		return apiinterface.HandleForbiddenError(fmt.Sprintf("you are not allowed to use this endpoint %q with the HTTP method %s", h.path, req.Method))
	}

	// Fan-out batch before reverse-proxy (upstream Prom has no query_range_batch).
	if isQueryRangeBatchPath(h.path) {
		return h.serveQueryRangeBatch(c)
	}

	if err := h.prepareRequest(c); err != nil {
		h.logWithDefaultEntry().WithError(err).Error("unable to prepare the HTTP request")
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

func (h *httpProxy) prepareRequest(c echo.Context) error {
	req := c.Request()
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
			if k == echo.HeaderAuthorization {
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
	return h.setupAuthentication(c)
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

func (h *httpProxy) setupAuthentication(c echo.Context) error {
	if h.config.OauthPassthrough {
		return h.setupOAuthPassthrough(c)
	}

	if h.secret == nil {
		return nil
	}

	req := c.Request()
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

func (h *httpProxy) setupOAuthPassthrough(c echo.Context) error {
	oidcCookie, err := c.Cookie(crypto.CookieKeyOIDCToken)
	if errors.Is(err, http.ErrNoCookie) {
		// OIDC token cookie is missing. It may have expired while the Perses session
		// was still valid. Attempt to refresh using the stored OIDC refresh token
		// before giving up.
		if h.tokenRefresher != nil {
			if _, refreshErr := c.Cookie(crypto.CookieKeyOIDCRefreshToken); refreshErr == nil {
				h.tokenRefresher(c)
				// Re-read the OIDC token cookie after the refresh attempt.
				oidcCookie, err = c.Cookie(crypto.CookieKeyOIDCToken)
			}
		}
		if errors.Is(err, http.ErrNoCookie) {
			return apiinterface.HandleBadRequestError(fmt.Sprintf(
				"you are querying datasource %q which is configured to use OAuthPassThrough, but no OAuth token is available in this session; try logging out and logging in again with the correct authentication provider",
				h.datasourceName,
			))
		}
	}

	req := c.Request()
	req.Header.Set(echo.HeaderAuthorization, fmt.Sprintf("Bearer %s", oidcCookie.Value))
	return nil
}

// getToken exchanges the client credentials for an access token,
// from the OAuth 2.0 provider.
func (h *httpProxy) getToken(ctx context.Context, oauth *secretModel.OAuth) (*oauth2.Token, error) {
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
	// The datasource can only lower the timeout set by the server (datasource.http_proxy.default_timeout and max_timeout).
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
	return &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   connectTimeout,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout: 10 * time.Second,
		IdleConnTimeout:     90 * time.Second,
		// The transport is reused across requests (see transportCache), and there is one transport per datasource.
		// A dashboard usually sends many queries in parallel to the same datasource,
		// so keep more idle connections than the Go default (2 per host) to actually reuse them.
		// Configured with datasource.http_proxy.max_idle_conns and datasource.http_proxy.max_idle_conns_per_host.
		MaxIdleConns:        h.proxyConfig.MaxIdleConns,
		MaxIdleConnsPerHost: h.proxyConfig.MaxIdleConnsPerHost,
		// Limit the connections opened to the datasource (configured with datasource.http_proxy.max_conns_per_host).
		// Once reached, requests wait for a connection to be available. Zero means no limit.
		MaxConnsPerHost:   h.proxyConfig.MaxConnsPerHost,
		ForceAttemptHTTP2: true,
		TLSClientConfig:   tlsConfig,
	}, nil
}

func (h *httpProxy) prepareTLSConfig() (*tls.Config, error) {
	if h.secret == nil {
		return &tls.Config{MinVersion: tls.VersionTLS12, MaxVersion: tls.VersionTLS13}, nil
	}
	return h.secret.TLSConfig.BuildTLSConfig()
}

type sqlQuery struct {
	Query string `json:"query"`
}

// errReadOnlyTx is returned by beginReadOnlyTx when the connection to the database is established,
// but the read-only transaction cannot be started.
var errReadOnlyTx = errors.New("unable to start a read-only transaction")

// beginReadOnlyTx connects to the database and starts a read-only transaction.
// The database is opened lazily: without connecting explicitly first, the errors to connect (network, TLS, authentication)
// could not be told apart from the ones to start the transaction (e.g. a database not supporting read-only transactions).
// The caller must roll back the transaction, then close the connection.
func beginReadOnlyTx(ctx context.Context, db *sql.DB) (*sql.Conn, *sql.Tx, error) {
	conn, err := db.Conn(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("unable to connect to the database: %w", err)
	}
	tx, err := conn.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		_ = conn.Close()
		return nil, nil, fmt.Errorf("%w: %w", errReadOnlyTx, err)
	}
	return conn, tx, nil
}

type sqlProxy struct {
	config   *datasourceSQL.Config
	secret   *v1.SecretSpec
	name     string
	project  string
	path     string
	username string
	password string
}

func (s *sqlProxy) logWithDefaultEntry() *logrus.Entry {
	return logrus.WithFields(map[string]interface{}{
		datasourceFieldLog: s.name,
		projectFieldLog:    projectForLog(s.project),
	})
}

func (s *sqlProxy) serve(c echo.Context) error {
	r := c.Request()

	// if this isn't a POST request don't perform the SQL query
	if r.Method != http.MethodPost {
		s.logWithDefaultEntry().WithField("method", r.Method).Error("SQL proxy requires POST request method when using SQLProxy kind")
		return echo.NewHTTPError(http.StatusMethodNotAllowed, fmt.Sprintf("you are not allowed to use this endpoint %q with the HTTP method %s", s.path, r.Method))
	}

	// Validate query is read-only before proceeding
	q := &sqlQuery{}
	if err := json.NewDecoder(r.Body).Decode(q); err != nil {
		s.logWithDefaultEntry().WithError(err).Error("unable to decode the query body")
		return apiinterface.HandleBadRequestError(err.Error())
	}

	// Sanitize and validate that the query is read-only (SELECT only) to prevent data modification
	// The cleaned query (without comments) is used for both validation and execution
	cleanQuery, isValid := sanitizeAndValidateQuery(q.Query)
	if !isValid {
		s.logWithDefaultEntry().WithField("query", q.Query).Error("rejected query not starting with a read statement keyword")
		return apiinterface.HandleBadRequestError(fmt.Sprintf("only read-only queries are allowed through the SQL proxy. The query must start with one of: %s, and must not contain INTO OUTFILE or INTO DUMPFILE", strings.Join(readOnlyStatementKeywords, ", ")))
	}

	// add password if provided
	if err := s.setupAuthentication(); err != nil {
		s.logWithDefaultEntry().WithError(err).Error("unable to setup authentication")
		return apiinterface.InternalError
	}

	// add tls.Config
	tlsConfig, err := s.prepareTLSConfig()
	if err != nil {
		s.logWithDefaultEntry().WithError(err).Error("unable to build the tls config")
		return apiinterface.InternalError
	}

	// get the correct SQL driver for address and open connection
	db, err := s.sqlOpen(tlsConfig)
	if err != nil {
		s.logWithDefaultEntry().WithError(err).WithField("driver", s.config.Driver).Error("unable to open the database")
		return apiinterface.InternalError
	}
	defer func(db *sql.DB) {
		if err = db.Close(); err != nil {
			s.logWithDefaultEntry().WithError(err).Error("unable to close the database")
		}
	}(db)

	// Execute the query in a read-only transaction. The check above only looks at the first keyword of the query,
	// so it cannot catch every statement modifying data. For example, a data-modifying CTE (WITH d AS (DELETE ...) SELECT ...),
	// or EXPLAIN ANALYZE of a write statement in PostgreSQL.
	// In a read-only transaction, the database itself rejects any change to the data or the schema.
	// The transaction is always rolled back: there is nothing to commit.
	conn, tx, err := beginReadOnlyTx(r.Context(), db)
	if err != nil {
		s.logWithDefaultEntry().WithError(err).Error("unable to execute the query in a read-only transaction")
		if errors.Is(err, errReadOnlyTx) {
			// The connection is established, but the database refuses the read-only transaction.
			// It happens with databases only compatible with the MySQL or PostgreSQL protocol.
			// The underlying error is logged server-side and not exposed to the client.
			return echo.NewHTTPError(http.StatusBadGateway, "unable to start a read-only transaction, which the SQL proxy requires for every query. See the server logs for details")
		}
		return apiinterface.InternalError
	}
	// The transaction must be rolled back before the connection is released: closing the connection waits for the transaction to end.
	defer func() {
		if rollbackErr := tx.Rollback(); rollbackErr != nil && !errors.Is(rollbackErr, sql.ErrTxDone) {
			s.logWithDefaultEntry().WithError(rollbackErr).Error("unable to roll back the read-only transaction")
		}
		if closeErr := conn.Close(); closeErr != nil && !errors.Is(closeErr, sql.ErrConnDone) {
			s.logWithDefaultEntry().WithError(closeErr).Error("unable to release the database connection")
		}
	}()

	// Execute the cleaned query (without comments) for safety
	rows, err := tx.QueryContext(r.Context(), cleanQuery)
	if err != nil {
		s.logWithDefaultEntry().WithError(err).WithField("query", cleanQuery).Error("unable to execute the query")
		return apiinterface.InternalError
	}
	defer func(rows *sql.Rows) {
		if err = rows.Close(); err != nil {
			s.logWithDefaultEntry().WithError(err).Error("unable to close rows")
		}
	}(rows)

	// write the SQL query result as JSON (for frontend consumption)
	if err = writeJSONResponse(c, rows, s.name, s.project); err != nil {
		s.logWithDefaultEntry().WithError(err).Error("unable to write the query result")
		return apiinterface.InternalError
	}

	return nil
}

func (s *sqlProxy) setupAuthentication() error {
	if s.secret == nil {
		return nil
	}

	basicAuth := s.secret.BasicAuth
	if basicAuth != nil {
		password, err := basicAuth.GetPassword()
		if err != nil {
			return err
		}
		s.username = basicAuth.Username
		s.password = password
	}

	return nil
}

// prepareTLSConfig returns the TLS config defined in the secret of the datasource, or nil if there is none.
// When there is none, the TLS behavior is defined by the datasource config (see buildMySQLConfig and buildPostgresConfig).
func (s *sqlProxy) prepareTLSConfig() (*tls.Config, error) {
	if s.secret == nil || s.secret.TLSConfig == nil {
		return nil, nil
	}
	return s.secret.TLSConfig.BuildTLSConfig()
}

// SQLOpen opens a database specified by its database driver in the address
func (s *sqlProxy) sqlOpen(tlsConfig *tls.Config) (*sql.DB, error) {
	switch s.config.Driver {
	case datasourceSQL.DriverMySQL, datasourceSQL.DriverMariaDB:
		return s.openMySQL(tlsConfig)
	case datasourceSQL.DriverPostgreSQL:
		return s.openPostgres(tlsConfig)
	default:
		return nil, fmt.Errorf("unsupported database driver: %s", s.config.Driver)
	}
}

// open mySQL specific database connection
func (s *sqlProxy) openMySQL(tlsConfig *tls.Config) (*sql.DB, error) {
	mysqlConfig, err := s.buildMySQLConfig(tlsConfig)
	if err != nil {
		return nil, err
	}
	connector, err := mysql.NewConnector(mysqlConfig)
	if err != nil {
		return nil, fmt.Errorf("invalid MySQL configuration: %w", err)
	}
	return sql.OpenDB(connector), nil
}

func (s *sqlProxy) buildMySQLConfig(tlsConfig *tls.Config) (*mysql.Config, error) {
	// Start from the default config of the driver. For example, it allows the mysql_native_password authentication,
	// which is the default authentication method of MariaDB.
	baseConfig := mysql.NewConfig()
	baseConfig.Net = "tcp"
	baseConfig.Addr = s.config.Host
	baseConfig.DBName = s.config.Database
	baseConfig.User = s.username
	baseConfig.Passwd = s.password

	// Use MariaDB config if a driver is MariaDB, otherwise use MySQL config
	driverConfig := s.config.MySQL
	if s.config.MariaDB != nil {
		driverConfig = s.config.MariaDB
	}

	if driverConfig != nil {
		dialTimeout, _ := common.ParseDuration(string(driverConfig.Timeout))
		readTimeout, _ := common.ParseDuration(string(driverConfig.ReadTimeout))
		writeTimeout, _ := common.ParseDuration(string(driverConfig.WriteTimeout))
		baseConfig.Params = driverConfig.Params
		if driverConfig.MaxAllowedPacket != 0 {
			baseConfig.MaxAllowedPacket = driverConfig.MaxAllowedPacket
		}
		baseConfig.Timeout = time.Duration(dialTimeout)
		baseConfig.ReadTimeout = time.Duration(readTimeout)
		baseConfig.WriteTimeout = time.Duration(writeTimeout)
	}

	// The params can contain options of the driver (e.g. parseTime, tls) as well as system variables.
	// Going through the DSN lets the driver interpret them exactly like in a DSN.
	mysqlConfig, err := mysql.ParseDSN(baseConfig.FormatDSN())
	if err != nil {
		return nil, fmt.Errorf("invalid MySQL configuration: %w", err)
	}

	// Never allow multiple statements in a query, whatever the params say.
	// Otherwise, a query like "SELECT 1; COMMIT; DELETE FROM ..." would end the read-only transaction the query is executed in.
	mysqlConfig.MultiStatements = false
	// The host of the datasource is set by the user and can be a server they control.
	// Whatever the params say, never enable the options that let such a server:
	//   - read any file of the Perses server: with allowAllFiles, the driver sends the file requested by the server
	//     with LOAD DATA LOCAL INFILE, and the server can request it in response to any query.
	//   - get the password of the datasource in clear text (allowCleartextPasswords),
	//     or authenticate with the insecure old password method (allowOldPasswords).
	mysqlConfig.AllowAllFiles = false
	mysqlConfig.AllowCleartextPasswords = false
	mysqlConfig.AllowOldPasswords = false

	switch {
	case tlsConfig != nil:
		// The TLS config is set on the connection config directly, and not registered in the global registry of the driver
		// (mysql.RegisterTLSConfig). With the registry, concurrent requests to datasources registering the same name
		// could use the TLS config of each other.
		// If the server name is not set, the driver sets it from the host (unless InsecureSkipVerify is set).
		mysqlConfig.TLS = tlsConfig
	case driverConfig == nil || len(driverConfig.Params["tls"]) == 0:
		// No TLS config in the secret, and no "tls" param: TLS is required, and the certificate of the server is verified
		// with the system CAs. TLS can be disabled with the param "tls" set to "false".
		mysqlConfig.TLS = &tls.Config{MinVersion: tls.VersionTLS12, MaxVersion: tls.VersionTLS13}
	}
	return mysqlConfig, nil
}

// open postgres specific database connection
func (s *sqlProxy) openPostgres(tlsConfig *tls.Config) (*sql.DB, error) {
	connConfig, err := s.buildPostgresConfig(tlsConfig)
	if err != nil {
		return nil, err
	}
	// The connection pool is the one of database/sql, so the max number of connections must be set on it.
	db := stdlib.OpenDB(*connConfig)
	if s.config.Postgres != nil && s.config.Postgres.MaxConns > 0 {
		db.SetMaxOpenConns(int(s.config.Postgres.MaxConns))
	}
	return db, nil
}

func (s *sqlProxy) buildPostgresConfig(tlsConfig *tls.Config) (*pgx.ConnConfig, error) {
	// build the postgres DSN for pgx to parse
	u := &url.URL{
		Scheme: "postgres",
		Host:   s.config.Host,
		// The database needs a '/' prefix
		Path: "/" + s.config.Database,
	}

	if s.username != "" && s.password == "" {
		u.User = url.User(s.username)
	}

	if s.username != "" && s.password != "" {
		u.User = url.UserPassword(s.username, s.password)
	}

	postgresConfig := s.config.Postgres
	if postgresConfig == nil {
		postgresConfig = &datasourceSQL.PostgresConfig{}
	}

	query := url.Values{}

	if postgresConfig.Options != "" {
		query.Set("options", postgresConfig.Options)
	}

	// PrepareThreshold is intentionally not used: it is an option of the PostgreSQL JDBC driver, unknown to pgx.
	// pgx would send it to the server as a runtime parameter, and the server would reject the connection
	// with "unrecognized configuration parameter".

	if len(postgresConfig.ConnectTimeout) > 0 {
		// The connect timeout is a duration (e.g. "10s"), while pgx expects a number of seconds.
		connectTimeout, err := common.ParseDuration(string(postgresConfig.ConnectTimeout))
		if err != nil {
			return nil, fmt.Errorf("invalid connectTimeout: %w", err)
		}
		if seconds := int64(math.Ceil(time.Duration(connectTimeout).Seconds())); seconds > 0 {
			query.Set("connect_timeout", strconv.FormatInt(seconds, 10))
		}
	}

	if postgresConfig.SSLMode != "" {
		query.Set("sslmode", string(postgresConfig.SSLMode))
	}

	u.RawQuery = query.Encode()

	// pgx.ParseConfig and not pgxpool.ParseConfig: the connection is opened with stdlib.OpenDB,
	// so the pool settings of pgxpool (e.g. pool_max_conns) would not be used.
	connConfig, err := pgx.ParseConfig(u.String())
	if err != nil {
		logrus.WithError(err).Error("failed to parse postgres address")
		return nil, err
	}

	// Without TLS config in the secret, the TLS behavior is the one defined by the sslMode.
	if tlsConfig != nil {
		if postgresConfig.SSLMode == "" || postgresConfig.SSLMode == datasourceSQL.SSLModeDisable {
			return nil, errors.New("the secret of the datasource defines a TLS config, but the sslMode is not set or set to disable. Set the sslMode to require, verify-ca or verify-full")
		}
		applyPostgresTLSConfig(connConfig, tlsConfig)
	}

	return connConfig, nil
}

// applyPostgresTLSConfig replaces the TLS config derived by pgx from the sslMode, with the TLS config of the secret.
// pgx derives one connection attempt per host, and depending on the sslMode, a fallback attempt (e.g. "prefer" tries with TLS, then without).
// The TLS config of the secret is used for every attempt using TLS. The attempts without TLS are kept as they are.
func applyPostgresTLSConfig(connConfig *pgx.ConnConfig, tlsConfig *tls.Config) {
	connConfig.TLSConfig = postgresTLSConfigForHost(connConfig.TLSConfig, tlsConfig, connConfig.Host)
	for _, fallback := range connConfig.Fallbacks {
		fallback.TLSConfig = postgresTLSConfigForHost(fallback.TLSConfig, tlsConfig, fallback.Host)
	}
}

func postgresTLSConfigForHost(derivedTLSConfig *tls.Config, tlsConfig *tls.Config, host string) *tls.Config {
	if derivedTLSConfig == nil {
		// This connection attempt doesn't use TLS.
		return nil
	}
	result := tlsConfig.Clone()
	// Unlike pgx, the TLS config of the secret doesn't necessarily define the server name.
	// Without it, the certificate of the server cannot be verified, and the TLS handshake fails.
	if result.ServerName == "" && !result.InsecureSkipVerify {
		result.ServerName = host
	}
	return result
}

// SQLColumnMetadata represents metadata for a single column in SQL result
type SQLColumnMetadata struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

// SQLRow represents a single row in an SQL result with column name to value mapping
type SQLRow map[string]any

// SQLResponse represents the complete SQL query response
type SQLResponse struct {
	Columns []SQLColumnMetadata `json:"columns"`
	Rows    []SQLRow            `json:"rows"`
}

func writeJSONResponse(c echo.Context, rows *sql.Rows, datasourceName, projectName string) error {
	cols, err := rows.Columns()
	if err != nil {
		logrus.WithError(err).WithFields(map[string]interface{}{
			datasourceFieldLog: datasourceName,
			projectFieldLog:    projectForLog(projectName),
		}).Error("unable to get columns from query result")
		return apiinterface.InternalError
	}

	colTypes, err := rows.ColumnTypes()
	if err != nil {
		logrus.WithError(err).WithFields(map[string]interface{}{
			datasourceFieldLog: datasourceName,
			projectFieldLog:    projectForLog(projectName),
		}).Error("unable to get column types from query result")
		return apiinterface.InternalError
	}

	// Build column metadata using proper struct
	columns := make([]SQLColumnMetadata, len(cols))
	for i, col := range cols {
		columns[i] = SQLColumnMetadata{
			Name: col,
			Type: colTypes[i].DatabaseTypeName(),
		}
	}

	// Create a slice of interface{} to hold the column values
	values := make([]any, len(cols))
	// Create a slice of interface{} pointers to hold references to actual column values
	scanArgs := make([]any, len(cols))
	for i := range values {
		scanArgs[i] = &values[i]
	}

	// Collect all rows using a proper struct
	rowsData := make([]SQLRow, 0)
	for rows.Next() {
		err = rows.Scan(scanArgs...)
		if err != nil {
			logrus.WithError(err).WithFields(map[string]interface{}{
				datasourceFieldLog: datasourceName,
				projectFieldLog:    projectForLog(projectName),
			}).Error("unable to scan row from query result")
			return apiinterface.InternalError
		}

		row := make(SQLRow)
		for i, col := range cols {
			val := values[i]
			if val == nil {
				row[col] = nil
			} else {
				// Convert []byte to string for better JSON serialization
				if b, ok := val.([]byte); ok {
					row[col] = string(b)
				} else {
					row[col] = val
				}
			}
		}
		rowsData = append(rowsData, row)
	}

	// Build response using a proper struct
	response := SQLResponse{
		Columns: columns,
		Rows:    rowsData,
	}

	// Set Content-Type and write JSON response
	c.Response().Header().Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	return c.JSON(http.StatusOK, response)
}

// sanitizeAndValidateQuery removes comments from a SQL query and validates it is read-only.
// Returns the cleaned query (without comments) and true if the query is safe to execute.
// Returns an empty string and false if the query contains write operations or is invalid.
// intoOutfilePattern matches SELECT ... INTO OUTFILE / INTO DUMPFILE, whatever the
// whitespace between the keywords (tab, newline, ...).
var intoOutfilePattern = regexp.MustCompile(`\bINTO\s+(OUTFILE|DUMPFILE)\b`)

// readOnlyStatementKeywords are the keywords a query sent to the SQL proxy is allowed to start with.
var readOnlyStatementKeywords = []string{"SELECT", "WITH", "SHOW", "DESCRIBE", "DESC", "EXPLAIN", "VALUES", "TABLE"}

func sanitizeAndValidateQuery(query string) (string, bool) {
	if query == "" {
		return "", false
	}

	// Normalize and remove comments
	normalizedQuery := strings.TrimSpace(query)
	if normalizedQuery == "" {
		return "", false
	}

	// Remove all comments to get a clean query for both validation and execution
	cleanQuery := removeSQLComments(normalizedQuery)
	cleanQuery = strings.TrimSpace(cleanQuery)

	// If nothing is left after removing comments, reject the query
	if cleanQuery == "" {
		return "", false
	}

	upperQuery := strings.ToUpper(cleanQuery)

	// Only allow the queries starting with a keyword of a read statement. It is an allowlist rather than a list of forbidden keywords,
	// as there are too many statements modifying data or the schema to list (e.g. CALL, DO, MERGE, COPY, RENAME, LOCK, ...).
	// Note that some statements modifying data can still start with one of these keywords, like a data-modifying CTE (WITH d AS (DELETE ...) SELECT ...)
	// or EXPLAIN ANALYZE of a write statement in PostgreSQL. That's why the query is also executed in a read-only transaction (see sqlProxy.serve).
	// The keyword check remains required: in MySQL, a statement modifying the schema (e.g. RENAME TABLE) implicitly commits the current transaction,
	// and is then not executed in the read-only transaction.
	if !slices.Contains(readOnlyStatementKeywords, firstKeyword(upperQuery)) {
		return "", false
	}

	// Reject the file-writing forms of SELECT in MySQL / MariaDB. A read-only transaction
	// prevents changes to the tables, but both MySQL and MariaDB permit
	// SELECT ... INTO OUTFILE / INTO DUMPFILE inside a read-only transaction, so the
	// database itself does not stop it. With the FILE privilege of the datasource's
	// database user, such a query writes a file on the database host.
	// The check is text-based: a string literal containing the exact pattern
	// "INTO OUTFILE" / "INTO DUMPFILE" is rejected as well, which is an accepted trade-off.
	if intoOutfilePattern.MatchString(upperQuery) {
		return "", false
	}

	// Query is valid and read-only, return the cleaned version
	return cleanQuery, true
}

// firstKeyword returns the first word of the query, ignoring the opening parentheses (e.g. "(SELECT 1) UNION (SELECT 2)").
func firstKeyword(query string) string {
	query = strings.TrimLeft(query, "( \t\r\n\f\v")
	end := strings.IndexFunc(query, func(r rune) bool { return !unicode.IsLetter(r) })
	if end == -1 {
		return query
	}
	return query[:end]
}

// removeSQLComments removes SQL comments from a string
// Supports both -- single-line comments and /* */ multi-line comments
func removeSQLComments(query string) string {
	var result strings.Builder
	i := 0

	for i < len(query) {
		// Check for single-line comment (-- or #)
		if i+1 < len(query) && (query[i:i+2] == "--" || query[i:i+2] == "/*") {
			if query[i:i+2] == "--" {
				// Skip until the end of line
				for i < len(query) && query[i] != '\n' {
					i++
				}
				if i < len(query) {
					result.WriteByte('\n')
					i++
				}
			} else if query[i:i+2] == "/*" {
				// Skip until closing */
				i += 2
				for i+1 < len(query) {
					if query[i:i+2] == "*/" {
						i += 2
						break
					}
					i++
				}
			}
		} else if i < len(query) {
			result.WriteByte(query[i])
			i++
		}
	}

	return result.String()
}
