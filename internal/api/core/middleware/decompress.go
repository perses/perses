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
)

// Decompress decompresses the gzip request bodies like the echo Decompress middleware does.
// The echo middleware only replaces the body: the headers Content-Encoding and Content-Length still describe the
// compressed body. A request forwarded as is (e.g. by the datasource proxy) would then be inconsistent and rejected.
// Once the body is decompressed, these headers are removed, and the length of the body becomes unknown.
func Decompress() echo.MiddlewareFunc {
	decompress := echoMiddleware.Decompress()
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return decompress(func(c echo.Context) error {
			req := c.Request()
			// The echo middleware calls the next handler with this header only when it decompressed the body
			// (or when the body is empty).
			if req.Header.Get(echo.HeaderContentEncoding) == echoMiddleware.GZIPEncoding {
				req.Header.Del(echo.HeaderContentEncoding)
				req.Header.Del(echo.HeaderContentLength)
				req.ContentLength = -1
			}
			return next(c)
		})
	}
}
