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

package ui

import (
	"bytes"
	"errors"
	"io"
	"io/fs"
	"net/http"
	"net/http/httputil"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	echoUtils "github.com/perses/common/echo"
	apiinterface "github.com/perses/perses/api/interface"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/prometheus/common/assets"
	"github.com/sirupsen/logrus"
)

const prefixPathPlaceholder = "PREFIX_PATH_PLACEHOLDER"

var (
	asts        = http.FS(assets.New(embedFS))
	reactRoutes = []string{
		"/admin",
		"/sign-in",
		"/sign-up",
		"/projects",
		"/import",
		"/config",
		"/explore",
	}
)

type frontend struct {
	echoUtils.Register
	apiPrefix            string
	pluginsPath          string
	pluginDevEnvironment *config.PluginDevEnvironment
}

func NewPersesFrontend(cfg config.Config) echoUtils.Register {
	return &frontend{
		apiPrefix:            cfg.APIPrefix,
		pluginsPath:          cfg.Plugins.Path,
		pluginDevEnvironment: cfg.Plugins.DevEnvironment,
	}
}

func (f *frontend) RegisterRoute(e *echo.Echo) {
	contentRewrite := middleware.Rewrite(map[string]string{f.apiPrefix + "/*": "/app/dist/$1"})
	e.GET(f.apiPrefix, func(c echo.Context) error {
		return serveASTFiles(c, f.apiPrefix)
	})

	// This route is serving the static files of the React app.
	// The middleware `routerMiddleware` is here to redirect the request to the React app if the URL path is matching one of the React routes.
	// Otherwise, the request is redirected to the `assetHandler` that is serving the static files, by changing the URL path to the correct path (with `contentRewrite`).
	e.GET(f.apiPrefix+"/*", assetHandler(f.apiPrefix), routerMiddleware(f.apiPrefix), contentRewrite)

	pluginGroup := e.Group(f.apiPrefix + "/plugins")
	if f.pluginDevEnvironment != nil {
		proxyMiddleware := pluginDevProxyMiddleware(*f.pluginDevEnvironment)
		pluginGroup.Use(proxyMiddleware)
	}
	// This route is serving the static files of the various plugins.
	pluginGroup.Static("/", f.pluginsPath)
}

// assetHandler is here to serve the static files of the React app.
// With Webpack, we have injected the placeholder in the index.html and in every JS file that contains a route.
// This is the only way to ensure that every asset is served with the proper prefix path.
// So, at runtime, we need to open the JS files and then replace the placeholder with the actual API prefix.
func assetHandler(apiPrefix string) echo.HandlerFunc {
	return func(c echo.Context) error {
		fileName := c.Request().URL.Path
		assetFile, err := asts.Open(fileName)
		if err != nil {
			logrus.WithError(err).Errorf("Unable to open the file %s", fileName)
			if errors.Is(err, fs.ErrNotExist) {
				err = apiinterface.NotFoundError
			}
			return apiinterface.HandleError(err)
		}
		defer assetFile.Close()
		data, err := io.ReadAll(assetFile)
		if err != nil {
			logrus.WithError(err).Error("Error reading React index.html")
			return apiinterface.HandleError(err)
		}
		if strings.Contains(fileName, ".js") {
			data = bytes.ReplaceAll(data, []byte(prefixPathPlaceholder), []byte(apiPrefix))
		}
		_, err = c.Response().Write(data)
		return apiinterface.HandleError(err)
	}
}

// pluginDevProxyMiddleware is here to proxy the request to the dev environment.
//
// When developing a plugin, you will be able to serve the files of the plugin using a dev server (with rsbuild).
// This middleware will route any request to a plugin listed in the dev environment to the dev server.
func pluginDevProxyMiddleware(devEnvironment config.PluginDevEnvironment) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			for _, plg := range devEnvironment.Plugins {
				if !strings.Contains(c.Request().URL.Path, plg.Name) {
					continue
				}
				// We are going to serve a plugin from a dev environment, let's set up the proxy to redirect the traffic.
				req := c.Request()
				res := c.Response()
				var proxyErr error
				// Then we need to route this request to the dev environment.
				// We just have to replace the URL as the path should remain the same.
				proxyURL := devEnvironment.URL
				if plg.URL != nil {
					proxyURL = plg.URL
				}
				reverseProxy := httputil.NewSingleHostReverseProxy(proxyURL.URL)
				reverseProxy.ErrorHandler = func(_ http.ResponseWriter, _ *http.Request, err error) {
					logrus.WithError(err).Errorf("error proxying, remote unreachable: target=%s, err=%v", devEnvironment.URL.String(), err)
					proxyErr = err
				}
				if transportErr := proxyPrepareRequest(c, devEnvironment); transportErr != nil {
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
			return next(c)
		}
	}
}

func proxyPrepareRequest(c echo.Context, devEnvironment config.PluginDevEnvironment) error {
	req := c.Request()
	// We have to modify the HOST of the request to match the host of the targetURL
	// So far I'm not sure to understand exactly why. However, if you are going to remove it, be sure of what you are doing.
	// It has been done to fix an error returned by Openshift itself saying the target doesn't exist.
	// Since we are using HTTP/1, setting the HOST is setting also a header, so if the host and the header are different,
	// then maybe it is blocked by the Openshift router.
	req.Host = devEnvironment.URL.Host
	// Fix header
	if len(req.Header.Get(echo.HeaderXRealIP)) == 0 {
		req.Header.Set(echo.HeaderXRealIP, c.RealIP())
	}
	if len(req.Header.Get(echo.HeaderXForwardedProto)) == 0 {
		req.Header.Set(echo.HeaderXForwardedProto, c.Scheme())
	}
	return nil
}

// routerMiddleware is here to serve properly the React app.
//
// As React is creating a single page application, it embeds its own router, which allows you to navigate in the UI without reloading it.
// For example, if you run the UI separately (with npm start), you will be able to access a dashboard using the URL http://localhost:3000/projects/perses/dashboards/<name>.
// But this is not working anymore when the UI is embedded in the binary, because then the echo router has no idea that the route /projects/:projectID/* is a React Route.
//
// Another problem that comes when you want to embed a UI in a binary is to be able to serve every single static file.
// The package embed is tackling this issue. But as a side effect, we are not able to know exactly how many static files it is serving,
// which is an issue. Then how can we know if the request is an internal route of the React app, or is a request to get a static file?
//
// The dummy idea is to provide a list of React route prefixes here. If the URL path is matching one of the prefixes, then the request is returning the index.html,
// because it's an internal React Route, and we need to let the React app manage it.
// If the URL Path doesn't match one of the prefixes, then it should be a static file that needs to be served. So we just rely on `contentHandler` that is serving the static file.
//
// In case the URL path is actually prefixed by /api/v1, then it's a request to the backend, and we can thank the echo Router that relies on the following routing
// strategy: if the URL path is matching the less generic route registered, then use this one, otherwise use the previous route that is a bit more generic and so on.
//
// E.g for the following routes:
// 1. /api/v1/projects/perses/dashboards/*
// 2. /api/v1/projects/*
// 3. /api/v1/*
// Then:
// - /api/v1/projects/perses/dashboards/* will be served by the first route
// - /api/v1/projects/test will be served by the second route
// - /api/v1/foo will be served by the last route.
func routerMiddleware(apiPrefix string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			for _, route := range reactRoutes {
				if !strings.HasPrefix(c.Request().URL.Path, apiPrefix+route) {
					continue
				}
				return serveASTFiles(c, apiPrefix)
			}
			return next(c)
		}
	}
}

func serveASTFiles(c echo.Context, apiPrefix string) error {
	f, err := asts.Open("/app/dist/index.html")
	if err != nil {
		logrus.WithError(err).Error("Unable to open the React index.html")
		return apiinterface.HandleError(err)
	}
	defer f.Close()
	idx, err := io.ReadAll(f)
	if err != nil {
		logrus.WithError(err).Error("Error reading React index.html")
		return apiinterface.HandleError(err)
	}
	idx = bytes.ReplaceAll(idx, []byte(prefixPathPlaceholder), []byte(apiPrefix))
	_, err = c.Response().Write(idx)
	return apiinterface.HandleError(err)
}
