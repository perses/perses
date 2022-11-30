// Copyright 2021 The Perses Authors
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
	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	datasourceHTTP "github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/sirupsen/logrus"
)

var (
	globalProxyMatcher = regexp.MustCompile(`/proxy/globaldatasources/([a-zA-Z-0-9_-]+)(/.*)?`)
	localProxyMatcher  = regexp.MustCompile(`/proxy/projects/([a-zA-Z-0-9_-]+)/datasources/([a-zA-Z-0-9_-]+)(/.*)?`)
)

func Proxy(dts datasource.DAO, globalDTS globaldatasource.DAO) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			spec, path, err := extractDatasourceAndPath(c, dts, globalDTS)
			if err != nil {
				return err
			}
			if spec == (v1.DatasourceSpec{}) {
				return next(c)
			}
			pr, err := newProxy(spec, path)
			if err != nil {
				return err
			}
			return pr.serve(c)
		}
	}
}

func extractDatasourceAndPath(c echo.Context, dts datasource.DAO, globalDTS globaldatasource.DAO) (v1.DatasourceSpec, string, error) {
	requestPath := c.Request().URL.Path
	globalDatasourceMatch := globalProxyMatcher.MatchString(requestPath)
	localDatasourceMatch := localProxyMatcher.MatchString(requestPath)
	if !globalDatasourceMatch && !localDatasourceMatch {
		// this is likely a request for the API itself
		return v1.DatasourceSpec{}, "", nil
	}

	if globalDatasourceMatch {
		return getGlobalDatasourceAndPath(globalDTS, requestPath)
	}
	return getLocalDatasourceAndPath(dts, requestPath)
}

func getGlobalDatasourceAndPath(dao globaldatasource.DAO, requestPath string) (v1.DatasourceSpec, string, error) {
	matchingGroups := globalProxyMatcher.FindAllStringSubmatch(requestPath, -1)
	if len(matchingGroups) > 1 || len(matchingGroups[0]) <= 1 {
		return v1.DatasourceSpec{}, "", echo.NewHTTPError(http.StatusBadGateway, "unable to forward the request to the datasource, request not properly formatted")
	}
	datasourceName := matchingGroups[0][1]
	// getting the datasource object
	dts, err := dao.Get(datasourceName)
	if err != nil {
		if etcd.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q", datasourceName)
			return v1.DatasourceSpec{}, "", echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("unable to forward the request to the datasource %q, datasource doesn't exist", datasourceName))
		}
		logrus.WithError(err).Errorf("unable to find the datasource %q, something wrong with the database", datasourceName)
		return v1.DatasourceSpec{}, "", echo.NewHTTPError(http.StatusInternalServerError, "internal server error")
	}
	// Based on the HTTP 1.1 RFC, a `/` should be the minimum path.
	// https://datatracker.ietf.org/doc/html/rfc2616#section-5.1.2
	path := "/"
	if len(matchingGroups[0]) > 2 {
		path = matchingGroups[0][2]
	}
	return dts.Spec, path, nil
}

func getLocalDatasourceAndPath(dao datasource.DAO, requestPath string) (v1.DatasourceSpec, string, error) {
	matchingGroups := localProxyMatcher.FindAllStringSubmatch(requestPath, -1)
	if len(matchingGroups) > 1 || len(matchingGroups[0]) <= 2 {
		return v1.DatasourceSpec{}, "", echo.NewHTTPError(http.StatusBadGateway, "unable to forward the request to the datasource, request not properly formatted")
	}
	projectName := matchingGroups[0][1]
	datasourceName := matchingGroups[0][2]
	// getting the datasource object
	dts, err := dao.Get(projectName, datasourceName)
	if err != nil {
		if etcd.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q in project %q", datasourceName, projectName)
			return v1.DatasourceSpec{}, "", echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("unable to forward the request to the datasource %q, datasource doesn't exist", datasourceName))
		}
		logrus.WithError(err).Errorf("unable to find the datasource %q, something wrong with the database", datasourceName)
		return v1.DatasourceSpec{}, "", echo.NewHTTPError(http.StatusInternalServerError, "internal server error")
	}
	// Based on the HTTP 1.1 RFC, a `/` should be the minimum path.
	// https://datatracker.ietf.org/doc/html/rfc2616#section-5.1.2
	path := "/"
	if len(matchingGroups[0]) > 3 {
		path = matchingGroups[0][3]
	}
	return dts.Spec, path, nil
}

type proxy interface {
	serve(c echo.Context) error
}

func newProxy(spec v1.DatasourceSpec, path string) (proxy, error) {
	cfg, err := datasourceHTTP.ValidateAndExtract(spec.Plugin.Spec)
	if err != nil {
		logrus.WithError(err).Error("unable to build or find the http config in the datasource")
		return nil, echo.NewHTTPError(http.StatusBadGateway, "unable to find the http config")
	}
	if cfg != nil {
		return &httpProxy{
			config: cfg,
			path:   path,
		}, nil
	}
	return nil, echo.NewHTTPError(http.StatusBadGateway, fmt.Sprintf("datasource type '%T' not managed", spec))
}

type httpProxy struct {
	config *datasourceHTTP.Config
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
	reverseProxy.Transport = h.prepareTransport()
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
}

func (h *httpProxy) prepareTransport() *http.Transport {
	tlsConfig := &tls.Config{MinVersion: tls.VersionTLS12}
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
	}
}
