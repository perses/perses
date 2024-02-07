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

package proxy

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httputil"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/interface"
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
	promConfig "github.com/prometheus/common/config"
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

type endpoint struct {
	dashboard    dashboard.DAO
	secret       secret.DAO
	globalSecret globalsecret.DAO
	dts          datasource.DAO
	globalDTS    globaldatasource.DAO
	crypto       crypto.Crypto
	rbac         rbac.RBAC
}

func New(dashboardDAO dashboard.DAO, secretDAO secret.DAO, globalSecretDAO globalsecret.DAO, dtsDAO datasource.DAO, globalDtsDAO globaldatasource.DAO, crypto crypto.Crypto, rbac rbac.RBAC) route.Endpoint {
	return &endpoint{
		dashboard:    dashboardDAO,
		secret:       secretDAO,
		globalSecret: globalSecretDAO,
		dts:          dtsDAO,
		globalDTS:    globalDtsDAO,
		crypto:       crypto,

		rbac: rbac,
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	g.ANY(fmt.Sprintf("/%s/:%s/*", utils.PathGlobalDatasource, utils.ParamName), e.proxySavedGlobalDatasource, true)
	g.ANY(fmt.Sprintf("/%s/:%s/%s/:%s/*", utils.PathProject, utils.ParamProject, utils.PathDatasource, utils.ParamName), e.proxySavedProjectDatasource, true)
	g.ANY(fmt.Sprintf("/%s/:%s/%s/:%s/%s/:%s/*", utils.PathProject, utils.ParamProject, utils.PathDashboard, utils.ParamDashboard, utils.PathDatasource, utils.ParamName), e.proxySavedDashboardDatasource, true)

	g.POST(fmt.Sprintf("/%s/%s/*", utils.PathUnsaved, utils.PathGlobalDatasource), e.proxyUnsavedGlobalDatasource, false)
	g.POST(fmt.Sprintf("/%s/%s/:%s/%s/*", utils.PathUnsaved, utils.PathProject, utils.ParamProject, utils.PathDatasource), e.proxyUnsavedProjectDatasource, false)
	g.POST(fmt.Sprintf("/%s/%s/:%s/%s/:%s/%s/*", utils.PathUnsaved, utils.PathProject, utils.ParamProject, utils.PathDashboard, utils.ParamDashboard, utils.PathDatasource), e.proxyUnsavedDashboardDatasource, false)
}

func (e *endpoint) checkPermission(ctx echo.Context, projectName string, scope role.Scope, action role.Action) error {
	claims := crypto.ExtractJWTClaims(ctx)
	if claims == nil {
		// If we're running without authentication, claims can be nil - just let requests through.
		return nil
	}

	if role.IsGlobalScope(scope) {
		if ok := e.rbac.HasPermission(claims.Subject, action, rbac.GlobalProject, scope); !ok {
			return apiinterface.HandleForbiddenError(fmt.Sprintf("missing '%s' global permission for '%s' kind", action, scope))
		}
		return nil
	}

	if ok := e.rbac.HasPermission(claims.Subject, action, projectName, scope); !ok {
		return apiinterface.HandleForbiddenError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", action, projectName, scope))
	}

	return nil
}

func (e *endpoint) proxyGlobalDatasource(ctx echo.Context, spec v1.DatasourceSpec) error {
	path := ctx.Param("*")
	pr, err := newProxy(spec, path, e.crypto, func(name string) (*v1.SecretSpec, error) {
		return e.getGlobalSecret(spec.Display.Name, name)
	})
	if err != nil {
		return err
	}
	return pr.serve(ctx)
}

func (e *endpoint) proxyUnsavedGlobalDatasource(ctx echo.Context) error {
	body := &unsavedProxyBody{}
	if err := ctx.Bind(body); err != nil {
		return err
	}

	if err := e.checkPermission(ctx, rbac.GlobalProject, role.GlobalDatasourceScope, role.CreateAction); err != nil {
		return err
	}

	body.setRequestParams(ctx)

	return e.proxyGlobalDatasource(ctx, body.Spec)
}

func (e *endpoint) proxySavedGlobalDatasource(ctx echo.Context) error {
	if err := e.checkPermission(ctx, rbac.GlobalProject, role.GlobalDatasourceScope, role.ReadAction); err != nil {
		return err
	}

	dtsName := ctx.Param(utils.ParamName)
	dts, err := e.getGlobalDatasource(dtsName)
	if err != nil {
		return err
	}

	return e.proxyGlobalDatasource(ctx, dts)
}

func (e *endpoint) proxyProjectDatasource(ctx echo.Context, projectName, dtsName string, spec v1.DatasourceSpec) error {
	path := ctx.Param("*")
	pr, err := newProxy(spec, path, e.crypto, func(name string) (*v1.SecretSpec, error) {
		return e.getProjectSecret(projectName, dtsName, name)
	})
	if err != nil {
		return err
	}
	return pr.serve(ctx)
}

func (e *endpoint) proxyUnsavedProjectDatasource(ctx echo.Context) error {
	projectName := ctx.Param(utils.ParamProject)
	body := &unsavedProxyBody{}
	if err := ctx.Bind(body); err != nil {
		return err
	}

	if err := e.checkPermission(ctx, projectName, role.DatasourceScope, role.CreateAction); err != nil {
		return err
	}

	body.setRequestParams(ctx)

	return e.proxyProjectDatasource(ctx, projectName, body.Spec.Display.Name, body.Spec)
}

func (e *endpoint) proxySavedProjectDatasource(ctx echo.Context) error {
	projectName := ctx.Param(utils.ParamProject)
	if err := e.checkPermission(ctx, projectName, role.DatasourceScope, role.ReadAction); err != nil {
		return err
	}

	dtsName := ctx.Param(utils.ParamName)
	dts, err := e.getProjectDatasource(projectName, dtsName)
	if err != nil {
		return err
	}

	return e.proxyProjectDatasource(ctx, projectName, dtsName, dts)
}

func (e *endpoint) proxyDashboardDatasource(ctx echo.Context, projectName, dtsName string, spec v1.DatasourceSpec) error {
	path := ctx.Param("*")

	pr, err := newProxy(spec, path, e.crypto, func(name string) (*v1.SecretSpec, error) {
		return e.getProjectSecret(projectName, dtsName, name)
	})
	if err != nil {
		return err
	}
	return pr.serve(ctx)
}

func (e *endpoint) proxyUnsavedDashboardDatasource(ctx echo.Context) error {
	projectName := ctx.Param(utils.ParamProject)
	body := &unsavedProxyBody{}
	if err := ctx.Bind(body); err != nil {
		return err
	}

	if err := e.checkPermission(ctx, projectName, role.DatasourceScope, role.CreateAction); err != nil {
		return err
	}

	body.setRequestParams(ctx)

	return e.proxyDashboardDatasource(ctx, projectName, body.Spec.Display.Name, body.Spec)
}

func (e *endpoint) proxySavedDashboardDatasource(ctx echo.Context) error {
	projectName := ctx.Param(utils.ParamProject)
	if err := e.checkPermission(ctx, projectName, role.DatasourceScope, role.ReadAction); err != nil {
		return err
	}

	dashboardName := ctx.Param(utils.ParamDashboard)
	dtsName := ctx.Param(utils.ParamName)

	dts, err := e.getDashboardDatasource(projectName, dashboardName, dtsName)
	if err != nil {
		return err
	}

	return e.proxyDashboardDatasource(ctx, projectName, dtsName, dts)
}

func (e *endpoint) getGlobalDatasource(name string) (v1.DatasourceSpec, error) {
	dts, err := e.globalDTS.Get(name)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q", name)
			return v1.DatasourceSpec{}, apiinterface.HandleNotFoundError(fmt.Sprintf("unable to forward the request to the datasource %q, datasource doesn't exist", name))
		}
		logrus.WithError(err).Errorf("unable to find the datasource %q, something wrong with the database", name)
		return v1.DatasourceSpec{}, apiinterface.InternalError
	}
	return dts.Spec, nil
}

func (e *endpoint) getProjectDatasource(projectName string, name string) (v1.DatasourceSpec, error) {
	dts, err := e.dts.Get(projectName, name)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q in project %q", name, projectName)
			return v1.DatasourceSpec{}, apiinterface.HandleNotFoundError(fmt.Sprintf("unable to forward the request to the datasource %q, datasource doesn't exist", name))
		}
		logrus.WithError(err).Errorf("unable to find the datasource %q, something wrong with the database", name)
		return v1.DatasourceSpec{}, apiinterface.InternalError
	}
	return dts.Spec, nil
}

func (e *endpoint) getDashboardDatasource(projectName string, dashboardName string, name string) (v1.DatasourceSpec, error) {
	db, err := e.dashboard.Get(projectName, dashboardName)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Dashboard %q in project %q", dashboardName, projectName)
			return v1.DatasourceSpec{}, apiinterface.HandleNotFoundError(fmt.Sprintf("unable to forward the request to the datasource %q, datasource doesn't exist", name))
		}
		logrus.WithError(err).Errorf("unable to find the datasource %q, something wrong with the database", name)
		return v1.DatasourceSpec{}, apiinterface.InternalError
	}
	dtsSpec, ok := db.Spec.Datasources[name]
	if !ok {
		logrus.Debugf("unable to find the Datasource %q from Dashboard %q in project %q", name, dashboardName, projectName)
		return v1.DatasourceSpec{}, apiinterface.HandleNotFoundError(fmt.Sprintf("unable to forward the request to the datasource %q, datasource doesn't exist", name))
	}
	return *dtsSpec, nil
}

func (e *endpoint) getGlobalSecret(dtsName, name string) (*v1.SecretSpec, error) {
	scrt, err := e.globalSecret.Get(name)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q", name)
			return nil, apiinterface.HandleNotFoundError(fmt.Sprintf("unable to forward the request to the datasource %q, secret %q attached doesn't exist", dtsName, name))
		}
		logrus.WithError(err).Errorf("unable to find the secret %q attached to the datasource %q, something wrong with the database", name, dtsName)
		return nil, apiinterface.InternalError
	}
	return &scrt.Spec, nil
}

func (e *endpoint) getProjectSecret(projectName string, dtsName string, name string) (*v1.SecretSpec, error) {
	scrt, err := e.secret.Get(projectName, name)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q", name)
			return nil, apiinterface.HandleNotFoundError(fmt.Sprintf("unable to forward the request to the datasource %q, secret %q attached doesn't exist", dtsName, name))
		}
		logrus.WithError(err).Errorf("unable to find the secret %q attached to the datasource %q, something wrong with the database", name, dtsName)
		return nil, apiinterface.InternalError
	}
	return &scrt.Spec, nil
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

	if cfg != nil {
		return &httpProxy{
			config: cfg,
			path:   path,
			secret: scrt,
		}, nil
	}
	return nil, echo.NewHTTPError(http.StatusBadGateway, fmt.Sprintf("datasource type '%T' not managed", spec))
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
	reverseProxy.ErrorHandler = func(writer http.ResponseWriter, request *http.Request, err error) {
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
	return nil
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
	if h.secret == nil || h.secret.TLSConfig == nil {
		return &tls.Config{MinVersion: tls.VersionTLS12}, nil
	}
	cfg := &promConfig.TLSConfig{
		CA:                 h.secret.TLSConfig.CA,
		Cert:               h.secret.TLSConfig.Cert,
		Key:                promConfig.Secret(h.secret.TLSConfig.Key),
		CAFile:             h.secret.TLSConfig.CAFile,
		CertFile:           h.secret.TLSConfig.CertFile,
		KeyFile:            h.secret.TLSConfig.KeyFile,
		ServerName:         h.secret.TLSConfig.ServerName,
		InsecureSkipVerify: h.secret.TLSConfig.InsecureSkipVerify,
		MinVersion:         promConfig.TLSVersions["TLS12"],
		MaxVersion:         promConfig.TLSVersions["TLS13"],
	}
	return promConfig.NewTLSConfig(cfg)
}
