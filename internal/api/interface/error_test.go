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

package apiinterface

import (
	"fmt"
	"net/http"
	"testing"

	echojwt "github.com/labstack/echo-jwt/v5"
	"github.com/labstack/echo/v5"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/stretchr/testify/assert"
)

func TestHandleError(t *testing.T) {
	tests := []struct {
		name           string
		err            error
		expectedStatus int
	}{
		// The errors coming from echo (routing, binding, middlewares, ...) must keep their status.
		{name: "route not found", err: echo.ErrNotFound, expectedStatus: http.StatusNotFound},
		{name: "method not allowed", err: echo.ErrMethodNotAllowed, expectedStatus: http.StatusMethodNotAllowed},
		{name: "request body too large", err: echo.ErrStatusRequestEntityTooLarge, expectedStatus: http.StatusRequestEntityTooLarge},
		{name: "unsupported media type", err: echo.ErrUnsupportedMediaType, expectedStatus: http.StatusUnsupportedMediaType},
		{name: "unauthorized", err: echo.ErrUnauthorized, expectedStatus: http.StatusUnauthorized},
		{name: "missing JWT", err: echojwt.ErrJWTMissing, expectedStatus: http.StatusUnauthorized},
		{name: "invalid JWT", err: echojwt.ErrJWTInvalid, expectedStatus: http.StatusUnauthorized},
		{name: "HTTP error", err: echo.NewHTTPError(http.StatusBadGateway, "unable to build or find the config"), expectedStatus: http.StatusBadGateway},
		// The errors of Perses are translated.
		{name: "document not found", err: &databaseModel.Error{Code: databaseModel.ErrorCodeNotFound}, expectedStatus: http.StatusNotFound},
		{name: "document conflict", err: &databaseModel.Error{Code: databaseModel.ErrorCodeConflict}, expectedStatus: http.StatusConflict},
		{name: "bad request", err: HandleBadRequestError("invalid name"), expectedStatus: http.StatusBadRequest},
		{name: "forbidden", err: HandleForbiddenError("missing permission"), expectedStatus: http.StatusForbidden},
		{name: "unauthorized Perses error", err: HandleUnauthorizedError("invalid credentials"), expectedStatus: http.StatusUnauthorized},
		{name: "not found", err: HandleNotFoundError("unknown plugin"), expectedStatus: http.StatusNotFound},
		{name: "unexpected error", err: fmt.Errorf("connection refused"), expectedStatus: http.StatusInternalServerError},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expectedStatus, echo.StatusCode(HandleError(tt.err)))
		})
	}
	assert.NoError(t, HandleError(nil))
}
