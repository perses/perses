// Copyright 2025 The Perses Authors
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
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httputil"
	"strings"
	"time"

	"github.com/perses/perses/pkg/model/api/config"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/globalsecret"
	"github.com/perses/perses/internal/api/interface/v1/secret"
	"github.com/perses/perses/internal/api/rbac"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	datasourceHTTP "github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/perses/perses/pkg/model/api/v1/role"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/sirupsen/logrus"
)

var _ = json.Unmarshaler(&unsavedProxyBody{})

// unsavedProxyBody is the body of the request when the datasource is not saved yet.
// It contains the body of the request and the datasource spec, which is used to build the proxy rather than
// retrieving the datasource from the database.
type unsavedProxyBody struct {
	Method string            `json:"method" yaml:"method"`
	Body   []byte            `json:"body,omitempty" yaml:"body"`
	Spec   v1.DatasourceSpec `json:"spec" yaml:"spec"`
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

	if _, err := datasourceHTTP.ValidateAndExtract(aux.Spec.Plugin.Spec); err != nil {
		return fmt.Errorf("invalid http config: %w", err)
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

	ctx.SetRequest(req)
}

const unsavedDatasourceDefaultName = "unsaved-datasource"

type endpoint struct {
	cfg          config.DatasourceConfig
	dashboard    dashboard.DAO
	secret       secret.DAO
	globalSecret globalsecret.DAO
	dts          datasource.DAO
	globalDTS    globaldatasource.DAO
	crypto       crypto.Crypto
	rbac         rbac.RBAC
	security     crypto.Security
}

func New(cfg config.DatasourceConfig, dashboardDAO dashboard.DAO, secretDAO secret.DAO, globalSecretDAO globalsecret.DAO,
	dtsDAO datasource.DAO, globalDtsDAO globaldatasource.DAO, crypto crypto.Crypto, rbac rbac.RBAC, security crypto.Security) route.Endpoint {
	return &endpoint{
		cfg:          cfg,
		dashboard:    dashboardDAO,
		secret:       secretDAO,
		globalSecret: globalSecretDAO,
		dts:          dtsDAO,
		globalDTS:    globalDtsDAO,
		crypto:       crypto,
		rbac:         rbac,
		security:     security,
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	if !e.cfg.Global.Disable {
		g.ANY(fmt.Sprintf("/%s/:%s/*", utils.PathGlobalDatasource, utils.ParamName), e.proxySavedGlobalDatasource, false)
		g.POST(fmt.Sprintf("/%s/%s/*", utils.PathUnsaved, utils.PathGlobalDatasource), e.proxyUnsavedGlobalDatasource, false)
	}
	if !e.cfg.Project.Disable {
		g.ANY(fmt.Sprintf("/%s/:%s/%s/:%s/*", utils.PathProject, utils.ParamProject, utils.PathDatasource, utils.ParamName), e.proxySavedProjectDatasource, false)
		g.POST(fmt.Sprintf("/%s/%s/:%s/%s/*", utils.PathUnsaved, utils.PathProject, utils.ParamProject, utils.PathDatasource), e.proxyUnsavedProjectDatasource, false)
	}
	if !e.cfg.DisableLocal {
		g.ANY(fmt.Sprintf("/%s/:%s/%s/:%s/%s/:%s/*", utils.PathProject, utils.ParamProject, utils.PathDashboard, utils.ParamDashboard, utils.PathDatasource, utils.ParamName), e.proxySavedDashboardDatasource, false)
		g.POST(fmt.Sprintf("/%s/%s/:%s/%s/:%s/%s/*", utils.PathUnsaved, utils.PathProject, utils.ParamProject, utils.PathDashboard, utils.ParamDashboard, utils.PathDatasource), e.proxyUnsavedDashboardDatasource, false)
	}
}

func (e *endpoint) checkPermission(ctx echo.Context, projectName string, scope role.Scope, action role.Action) error {
	user := e.security.GetUser(ctx)
	if user == "" {
		// If we're running without authentication, claims can be nil - just let requests through.
		return nil
	}

	if role.IsGlobalScope(scope) {
		if ok := e.rbac.HasPermission(ctx, user, action, rbac.GlobalProject, scope); !ok {
			return apiinterface.HandleForbiddenError(fmt.Sprintf("missing '%s' global permission for '%s' kind", action, scope))
		}
		return nil
	}

	if ok := e.rbac.HasPermission(ctx, user, action, projectName, scope); !ok {
		return apiinterface.HandleForbiddenError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", action, projectName, scope))
	}

	return nil
}

type proxy interface {
	serve(c echo.Context) error
}

func newProxy(spec v1.DatasourceSpec, path string, crypto crypto.Crypto, retrieveSecret func(name string) (*v1.SecretSpec, error)) (proxy, error) {
	cfg, err := datasourceHTTP.ValidateAndExtract(spec.Plugin.Spec)
	if err != nil {
		logrus.WithError(err).Error("unable to build or find the http config in the datasource")
		return nil, echo.NewHTTPError(http.StatusBadGateway, "unable to find the http config")
	}
	if cfg == nil {
		logrus.Error("unable to find the http config in the datasource")
		return nil, echo.NewHTTPError(http.StatusBadGateway, fmt.Sprintf("datasource type '%T' not managed", spec))
	}
	var scrt *v1.SecretSpec
	if len(cfg.Secret) > 0 {
		scrt, err = retrieveSecret(cfg.Secret)
		if err != nil {
			return nil, err
		}
		if decryptErr := crypto.Decrypt(scrt); decryptErr != nil {
			logrus.WithError(err).Errorf("unable to decrypt the secret")
			return nil, apiinterface.InternalError
		}
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}

	return &httpProxy{
		config: cfg,
		path:   path,
		secret: scrt,
	}, nil
}

type httpProxy struct {
	config *datasourceHTTP.Config
	secret *v1.SecretSpec
	path   string
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
		logrus.WithError(err).Errorf("unable to prepare the request")
		return apiinterface.InternalError
	}

	// redirect the request to the datasource
	req.URL.Path = h.path
	logrus.Debugf("request will be redirected to %q", h.config.URL.String())

	// Set up the proxy
	var proxyErr error
	reverseProxy := httputil.NewSingleHostReverseProxy(h.config.URL.URL)
	reverseProxy.ErrorHandler = func(_ http.ResponseWriter, _ *http.Request, err error) {
		logrus.WithError(err).Errorf("error proxying, remote unreachable: target=%s, err=%v", h.config.URL.String(), err)
		proxyErr = err
	}
	// use a dedicated HTTP transport to avoid any TLS encryption issues
	var transportErr error
	reverseProxy.Transport, transportErr = h.prepareTransport()
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
		// TODO list the headers that cannot be overridden.
		for k, v := range h.config.Headers {
			req.Header.Set(k, v)
		}
	}
	return h.setupAuthentication(req)
}

func (h *httpProxy) setupAuthentication(req *http.Request) error {
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
	auth := h.secret.Authorization
	if auth != nil {
		credential, err := auth.GetCredentials()
		if err != nil {
			return err
		}
		req.Header.Set("Authorization", fmt.Sprintf("%s %s", auth.Type, credential))
	}
	oauth := h.secret.OAuth
	if oauth != nil {
		token, err := h.getToken(req.Context(), oauth)
		if err != nil {
			return err
		}
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token.AccessToken))
	}

	return nil
}

// getToken exchanges the client credentials for an access token,
// from the OAuth 2.0 provider.
func (h *httpProxy) getToken(ctx context.Context, oauth *secretModel.OAuth) (*oauth2.Token, error) {
	transport, err := h.prepareTransport()
	if err != nil {
		return nil, err
	}

	httpClient := http.Client{
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

func (h *httpProxy) prepareTransport() (*http.Transport, error) {
	tlsConfig, err := h.prepareTLSConfig()
	if err != nil {
		logrus.WithError(err).Error("unable to build the tls config")
		return nil, echo.NewHTTPError(http.StatusBadGateway, "unable build the tls config")
	}
	return &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout: 10 * time.Second,
		IdleConnTimeout:     90 * time.Second,
		ForceAttemptHTTP2:   true,
		TLSClientConfig:     tlsConfig,
	}, nil
}

func (h *httpProxy) prepareTLSConfig() (*tls.Config, error) {
	if h.secret == nil {
		return &tls.Config{MinVersion: tls.VersionTLS12}, nil
	}
	return secretModel.BuildTLSConfig(h.secret.TLSConfig)
}
