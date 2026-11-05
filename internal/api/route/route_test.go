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

package route

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
)

func TestGroupANYMethods(t *testing.T) {
	g := &Group{Path: "/proxy"}
	g.ANY("/*", func(c echo.Context) error {
		return c.NoContent(http.StatusOK)
	}, false)
	e := echo.New()
	echoGroup := e.Group(g.Path)
	for _, r := range g.Routes {
		r.Register(echoGroup)
	}

	tests := []struct {
		method         string
		expectedStatus int
	}{
		{method: http.MethodConnect, expectedStatus: http.StatusOK},
		{method: http.MethodDelete, expectedStatus: http.StatusOK},
		{method: http.MethodGet, expectedStatus: http.StatusOK},
		{method: http.MethodHead, expectedStatus: http.StatusOK},
		{method: http.MethodOptions, expectedStatus: http.StatusOK},
		{method: http.MethodPatch, expectedStatus: http.StatusOK},
		{method: http.MethodPost, expectedStatus: http.StatusOK},
		{method: "PROPFIND", expectedStatus: http.StatusOK},
		{method: http.MethodPut, expectedStatus: http.StatusOK},
		{method: http.MethodTrace, expectedStatus: http.StatusOK},
		{method: "REPORT", expectedStatus: http.StatusOK},
		// The other methods are rejected, and so not forwarded to the datasources.
		{method: "QUERY", expectedStatus: http.StatusMethodNotAllowed},
		{method: "PURGE", expectedStatus: http.StatusMethodNotAllowed},
		{method: "MKCOL", expectedStatus: http.StatusMethodNotAllowed},
		{method: "LOCK", expectedStatus: http.StatusMethodNotAllowed},
		{method: "FOO", expectedStatus: http.StatusMethodNotAllowed},
	}
	for _, tt := range tests {
		t.Run(tt.method, func(t *testing.T) {
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, httptest.NewRequest(tt.method, "/proxy/api/v1/query", nil))
			assert.Equal(t, tt.expectedStatus, rec.Code)
		})
	}
}
