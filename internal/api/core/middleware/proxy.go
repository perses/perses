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

package middleware

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"regexp"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/globalsecret"
	"github.com/perses/perses/internal/api/interface/v1/secret"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	datasourceHTTP "github.com/perses/perses/pkg/model/api/v1/datasource/http"
	promConfig "github.com/prometheus/common/config"
	"github.com/sirupsen/logrus"
)

var (
	globalProxyMatcher  = regexp.MustCompile(`/proxy/globaldatasources/([a-zA-Z-0-9_-]+)(/.*)?`)
	projectProxyMatcher = regexp.MustCompile(`/proxy/projects/([a-zA-Z-0-9_-]+)/datasources/([a-zA-Z-0-9_-]+)(/.*)?`)
)

// TODO cache the request to the database

func extractGlobalDatasourceAndPath(requestPath string) (dtsName string, path string, err error) {
	matchingGroups := globalProxyMatcher.FindAllStringSubmatch(requestPath, -1)
	if len(matchingGroups) > 1 || len(matchingGroups[0]) <= 1 {
		return "", "", echo.NewHTTPError(http.StatusBadGateway, "unable to forward the request to the datasource, request not properly formatted")
	}
	dtsName = matchingGroups[0][1]
	// Based on the HTTP 1.1 RFC, a `/` should be the minimum path.
	// https://datatracker.ietf.org/doc/html/rfc2616#section-5.1.2
	path = "/"
	if len(matchingGroups[0]) > 2 && len(matchingGroups[0][2]) > 0 {
		path = matchingGroups[0][2]
	}
	return
}

func extractProjectDatasourceAndPath(requestPath string) (projectName string, dtsName string, path string, err error) {
	matchingGroups := projectProxyMatcher.FindAllStringSubmatch(requestPath, -1)
	if len(matchingGroups) > 1 || len(matchingGroups[0]) <= 2 {
		return "", "", "", echo.NewHTTPError(http.StatusBadGateway, "unable to forward the request to the datasource, request not properly formatted")
	}
	projectName = matchingGroups[0][1]
	dtsName = matchingGroups[0][2]
	// Based on the HTTP 1.1 RFC, a `/` should be the minimum path.
	// https://datatracker.ietf.org/doc/html/rfc2616#section-5.1.2
	path = "/"
	if len(matchingGroups[0]) > 3 && len(matchingGroups[0][3]) > 0 {
		path = matchingGroups[0][3]
	}
	return
}

type Proxy struct {
	Secret       secret.DAO
	GlobalSecret globalsecret.DAO
	DTS          datasource.DAO
	GlobalDTS    globaldatasource.DAO
}

func (e *Proxy) Proxy() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			requestPath := c.Request().URL.Path
			globalDatasourceMatch := globalProxyMatcher.MatchString(requestPath)
			localDatasourceMatch := projectProxyMatcher.MatchString(requestPath)
			if !globalDatasourceMatch && !localDatasourceMatch {
				// this is likely a request for the API itself
				return next(c)
			}
			if globalDatasourceMatch {
				return e.proxyGlobalDatasource(c)
			}
			return e.proxyProjectDatasource(c)
		}
	}
}

func (e *Proxy) proxyGlobalDatasource(ctx echo.Context) error {
	dtsName, path, err := extractGlobalDatasourceAndPath(ctx.Request().URL.Path)
	if err != nil {
		return err
	}
	dts, err := e.getGlobalDatasource(dtsName)
	if err != nil {
		return err
	}
	pr, err := newProxy(dts, path, func(name string) (*v1.SecretSpec, error) {
		return e.getGlobalSecret(dtsName, name)
	})
	if err != nil {
		return err
	}
	return pr.serve(ctx)
}

func (e *Proxy) proxyProjectDatasource(ctx echo.Context) error {
	projectName, dtsName, path, err := extractProjectDatasourceAndPath(ctx.Request().URL.Path)
	if err != nil {
		return err
	}
	dts, err := e.getProjectDatasource(projectName, dtsName)
	if err != nil {
		return err
	}
	pr, err := newProxy(dts, path, func(name string) (*v1.SecretSpec, error) {
		return e.getProjectSecret(projectName, dtsName, name)
	})
	if err != nil {
		return err
	}
	return pr.serve(ctx)
}

func (e *Proxy) getGlobalDatasource(name string) (v1.DatasourceSpec, error) {
	dts, err := e.GlobalDTS.Get(name)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q", name)
			return v1.DatasourceSpec{}, echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("unable to forward the request to the datasource %q, datasource doesn't exist", name))
		}
		logrus.WithError(err).Errorf("unable to find the datasource %q, something wrong with the database", name)
		return v1.DatasourceSpec{}, echo.NewHTTPError(http.StatusInternalServerError, "internal server error")
	}
	return dts.Spec, nil
}
func (e *Proxy) getProjectDatasource(projectName string, name string) (v1.DatasourceSpec, error) {
	dts, err := e.DTS.Get(projectName, name)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q in project %q", name, projectName)
			return v1.DatasourceSpec{}, echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("unable to forward the request to the datasource %q, datasource doesn't exist", name))
		}
		logrus.WithError(err).Errorf("unable to find the datasource %q, something wrong with the database", name)
		return v1.DatasourceSpec{}, echo.NewHTTPError(http.StatusInternalServerError, "internal server error")
	}
	return dts.Spec, nil
}

func (e *Proxy) getGlobalSecret(dtsName, name string) (*v1.SecretSpec, error) {
	scrt, err := e.GlobalSecret.Get(name)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q", name)
			return nil, echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("unable to forward the request to the datasource %q, secret %q attached doesn't exist", dtsName, name))
		}
		logrus.WithError(err).Errorf("unable to find the secret %q attached to the datasource %q, something wrong with the database", name, dtsName)
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "internal server error")
	}
	return &scrt.Spec, nil
}

func (e *Proxy) getProjectSecret(projectName string, dtsName string, name string) (*v1.SecretSpec, error) {
	scrt, err := e.Secret.Get(projectName, name)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q", name)
			return nil, echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("unable to forward the request to the datasource %q, secret %q attached doesn't exist", dtsName, name))
		}
		logrus.WithError(err).Errorf("unable to find the secret %q attached to the datasource %q, something wrong with the database", name, dtsName)
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "internal server error")
	}
	return &scrt.Spec, nil
}

type proxy interface {
	serve(c echo.Context) error
}

func newProxy(spec v1.DatasourceSpec, path string, retrieveSecret func(name string) (*v1.SecretSpec, error)) (proxy, error) {
	cfg, err := datasourceHTTP.ValidateAndExtract(spec.Plugin.Spec)
	if err != nil {
		logrus.WithError(err).Error("unable to build or find the http config in the datasource")
		return nil, echo.NewHTTPError(http.StatusBadGateway, "unable to find the http config")
	}
	var scrt *v1.SecretSpec
	if len(cfg.Secret) > 0 {
		scrt, err = retrieveSecret(cfg.Secret)
		if err == nil {
			return nil, err
		}
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
		return echo.NewHTTPError(http.StatusForbidden, fmt.Sprintf("you are not allowed to use this endpoint %q with the HTTP method %s", h.path, req.Method))
	}

	h.prepareRequest(c)

	// redirect the request to the datasource
	req.URL.Path = h.path
	logrus.Debugf("request will be redirected to %q", h.config.URL.String())

	// Set up the proxy
	var proxyErr error
	reverseProxy := httputil.NewSingleHostReverseProxy(h.config.URL)
	reverseProxy.ErrorHandler = func(writer http.ResponseWriter, request *http.Request, err error) {
		desc := h.config.URL.String()
		logrus.WithError(err).Errorf("error proxying, remote unreachable: target=%s, err=%v", desc, err)
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
	return proxyErr
}

func (h *httpProxy) prepareRequest(c echo.Context) {
	req := c.Request()
	// We have to modify the HOST of the request in order to match the host of the targetURL
	// So far I'm not sure to understand exactly why, but if you are going to remove it, be sure of what you are doing.
	// It has been done to fix an error returned by Openshift itself saying the target doesn't exist.
	// Since we are using HTTP/1, setting the HOST is setting also an header so if the host and the header are different
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
	h.setupAuthentication(req)
}

func (h *httpProxy) setupAuthentication(req *http.Request) {
	if h.secret == nil {
		return
	}
	basicAuth := h.secret.BasicAuth
	if basicAuth != nil {
		req.SetBasicAuth(basicAuth.Username, basicAuth.Password)
	}
	auth := h.secret.Authorization
	if auth != nil {
		req.Header.Set("Authorization", fmt.Sprintf("%s %s", auth.Type, auth.Credentials))
	}
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
