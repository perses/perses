// Copyright 2024 The Perses Authors
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
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

func HandleAPIPrefix(apiPrefix string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if !strings.HasPrefix(c.Request().URL.Path, apiPrefix) {
				return c.Redirect(http.StatusFound, apiPrefix+c.Request().URL.Path)
			}
			return next(c)
		}
	}
}
