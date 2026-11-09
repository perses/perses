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
	"compress/gzip"
	"errors"
	"io"
	"strings"

	"github.com/labstack/echo/v5"
	echoMiddleware "github.com/labstack/echo/v5/middleware"
)

// Decompress decompresses the gzip request bodies like the echo Decompress middleware does.
// The echo middleware only replaces the body (and sets the length of the request as unknown): the headers
// Content-Encoding and Content-Length still describe the compressed body. A request forwarded as is (e.g. by the
// datasource proxy) would then be inconsistent and rejected. Once the body is decompressed, these headers are removed.
// A body that is not a valid gzip stream is rejected with the status 400.
func Decompress() echo.MiddlewareFunc {
	decompress := echoMiddleware.Decompress()
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		handler := decompress(func(c *echo.Context) error {
			req := c.Request()
			// The echo middleware calls the next handler with this header only when it decompressed the body
			// (or when the body is empty). Like the echo middleware, the value is compared without considering the case.
			if strings.EqualFold(req.Header.Get(echo.HeaderContentEncoding), echoMiddleware.GZIPEncoding) {
				req.Header.Del(echo.HeaderContentEncoding)
				req.Header.Del(echo.HeaderContentLength)
			}
			return next(c)
		})
		return func(c *echo.Context) error {
			err := handler(c)
			// When the body is not a valid gzip stream, the echo middleware returns the error of the gzip reader as is:
			// gzip.ErrHeader, or io.ErrUnexpectedEOF when the header is truncated. This error is caused by the client,
			// but without an HTTP status, it would be answered with 500 and logged as an unexpected error.
			if echo.StatusCode(err) == 0 && (errors.Is(err, gzip.ErrHeader) || errors.Is(err, io.ErrUnexpectedEOF)) {
				return echo.ErrBadRequest.Wrap(err)
			}
			return err
		}
	}
}
