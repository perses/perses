// Copyright 2022 The Perses Authors
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
