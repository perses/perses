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
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"regexp"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/sirupsen/logrus"
)

var (
	proxyMatcher                       = regexp.MustCompile(`/proxy/datasources/([a-zA-Z-0-9_-]+)(/.*)?`)
	defaultTransport http.RoundTripper = &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			DualStack: true,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout: 10 * time.Second,
		MaxIdleConns:        100,
		IdleConnTimeout:     90 * time.Second,
		ForceAttemptHTTP2:   true,
	}
)

func Proxy(dao datasource.DAO) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			targetURL, err := buildProxy(c, dao)
			if err != nil {
				return err
			}
			if targetURL == nil {
				return next(c)
			}
			return serveProxy(c, targetURL)
		}
	}
}

func buildProxy(c echo.Context, dao datasource.DAO) (*url.URL, error) {
	req := c.Request()
	requestPath := req.URL.Path
	if !proxyMatcher.MatchString(requestPath) {
		// request is not matching the proxy path. Probably it's a request to the API itself
		// That's why no error is returned in order to let the request passed.
		return nil, nil
	}
	logrus.Tracef("'%s' is a request to a datasource", requestPath)
	matchingGroups := proxyMatcher.FindAllStringSubmatch(requestPath, -1)
	if len(matchingGroups) > 1 || len(matchingGroups[0]) <= 1 {
		return nil, echo.NewHTTPError(http.StatusBadGateway, "unable to forward the request to the datasource, request not properly formatted")
	}
	datasourceName := matchingGroups[0][1]
	// getting the datasource object
	dts, err := dao.Get(datasourceName)
	if err != nil {
		if etcd.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource '%s'", datasourceName)
			return nil, echo.NewHTTPError(http.StatusBadGateway, fmt.Sprintf("unable to forward the request to the datasource '%s', datasource doesn't exist", datasourceName))
		}
		logrus.WithError(err).Errorf("unable to find the datasource '%s', something wrong with the database", datasourceName)
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "internal server error")
	}
	// Based on the HTTP 1.1 RFC, a `/` should be the minimum path.
	// https://datatracker.ietf.org/doc/html/rfc2616#section-5.1.2
	path := "/"
	if len(matchingGroups[0]) > 1 {
		path = matchingGroups[0][2]
	}

	// redirect the request to the datasource
	req.URL.Path = path
	return dts.Spec.URL, nil
}

func serveProxy(c echo.Context, targetURL *url.URL) error {
	req := c.Request()
	res := c.Response()

	// We have to modify the HOST of the request in order to match the host of the targetURL
	// So far I'm not sure to understand exactly why, but if you are going to remove it, be sure of what you are doing.
	// It has been done to fix an error returned by Openshift itself saying the target doesn't exist.
	// Since we are using HTTP/1, setting the HOST is setting also an header so if the host and the header are different
	// then maybe it is blocked by the Openshift router.
	req.Host = targetURL.Host
	// Fix header
	if len(req.Header.Get(echo.HeaderXRealIP)) == 0 {
		req.Header.Set(echo.HeaderXRealIP, c.RealIP())
	}
	if len(req.Header.Get(echo.HeaderXForwardedProto)) == 0 {
		req.Header.Set(echo.HeaderXForwardedProto, c.Scheme())
	}

	// Set up the proxy
	var proxyErr error
	proxy := httputil.NewSingleHostReverseProxy(targetURL)
	proxy.ErrorHandler = func(writer http.ResponseWriter, request *http.Request, err error) {
		desc := targetURL.String()
		proxyErr = fmt.Errorf("error proxying, remote unreachable: target=%s, err=%w", desc, err)
		logrus.Errorf(proxyErr.Error())
		proxyErr = err
	}
	// use a dedicated HTTP transport to avoid any TSL encrypt issue
	proxy.Transport = defaultTransport
	// Reverse proxy request.
	proxy.ServeHTTP(res, req)
	// Return any error handled during proxying request.
	return proxyErr
}
