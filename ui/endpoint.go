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
	"io"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	echoUtils "github.com/perses/common/echo"
	"github.com/perses/perses/internal/api/shared"
	"github.com/prometheus/common/assets"
	"github.com/sirupsen/logrus"
)

var (
	asts        = http.FS(assets.New(embedFS))
	reactRoutes = []string{
		"/projects",
		"/migrate",
	}
)

type frontend struct {
	echoUtils.Register
}

func NewPersesFrontend() echoUtils.Register {
	return &frontend{}
}

func (f *frontend) RegisterRoute(e *echo.Echo) {
	contentHandler := echo.WrapHandler(http.FileServer(asts))
	contentRewrite := middleware.Rewrite(map[string]string{"/*": "/app/dist/$1"})
	e.GET("/*", contentHandler, routerMiddleware(), contentRewrite)
}

// routerMiddleware is here to serve properly the react app.
//
// As React is creating a single page application, it embeds its own router, which allows you to navigate in the UI without reloading it.
// For example, if you run the UI separately (with npm start), you will be able to access a dashboard using the URL http://localhost:3000/projects/perses/dashboards/<name>.
// But this is not working anymore when the UI is embedded in the binary, because then the echo router has no idea that the route /projects/:projectID/* is a React Route.
//
// Another problem that comes when you want to embed a UI in a binary is to be able to serve every single static file.
// The package embed is tackling this issue. But as a side effect, we are not able to know exactly how many static files it is serving,
// which is an issue because then how can we know if the request is an internal route of the React app, or is a request to get a static file.
//
// The dummy idea is to provide a list of react route prefixes here. If the URL path is matching one of the prefix, then the request is returning the index.html,
// because it's an internal React Route and we need to let the React app manage it.
// If the URL Path doesn't match one of the prefix, then it should be a static file that needs to be served. So we just rely on `contentHandler` that is serving the static file.
//
// In case the URL path is actually prefixed by /api/v1, then it's a request to the backend, and we can thanks the echo Router that relies on the following routing
// strategy: if the URL path is matching the less generic route registered, then use this one, otherwise use the previous route that is a bit more generic and so on.
//
// E.g for the following routes :
// 1. /api/v1/projects/perses/dashboards/*
// 2. /api/v1/projects/*
// 3. /api/v1/*
// Then:
// - /api/v1/projects/perses/dashboards/* will be served by the first route
// - /api/v1/projects/test will be served by the second route
// - /api/v1/foo will be served by the last route.
func routerMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			for _, route := range reactRoutes {
				if !strings.HasPrefix(c.Request().URL.Path, route) {
					continue
				}
				f, err := asts.Open("/app/dist/index.html")
				if err != nil {
					logrus.WithError(err).Error("Unable to open the React index.html")
					return shared.HandleError(err)
				}
				idx, err := io.ReadAll(f)
				if err != nil {
					logrus.WithError(err).Error("Error reading React index.html")
					return shared.HandleError(err)
				}
				_, err = c.Response().Write(idx)
				return shared.HandleError(err)
			}
			return next(c)
		}
	}
}
