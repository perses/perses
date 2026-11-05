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

package middleware

import (
	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/perses/perses/pkg/model/api/config"
)

// CORS returns the middleware handling the CORS requests according to the given configuration.
func CORS(conf config.CORSConfig) echo.MiddlewareFunc {
	return echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins:     conf.AllowOrigins,
		AllowMethods:     conf.AllowMethods,
		AllowHeaders:     conf.AllowHeaders,
		AllowCredentials: conf.AllowCredentials,
		ExposeHeaders:    conf.ExposeHeaders,
		MaxAge:           conf.MaxAge,
	})
}
