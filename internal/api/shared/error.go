// Copyright 2021 Amadeus s.a.s
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

package shared

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"
)

type PersesError struct {
	message string
}

func (e *PersesError) Error() string {
	return e.message
}

var (
	InternalError   = &PersesError{message: "internal server error"}
	NotFoundError   = &PersesError{message: "document not found"}
	ConflictError   = &PersesError{message: "document already exists"}
	BadRequestError = &PersesError{message: "bad request"}
)

// handleError is translating the given error to the echoHTTPError
func handleError(err error) error {
	if err == nil {
		return nil
	}

	if errors.Is(err, InternalError) {
		return echo.NewHTTPError(http.StatusInternalServerError, InternalError.message)
	}
	if errors.Is(err, NotFoundError) {
		return echo.NewHTTPError(http.StatusNotFound, NotFoundError.message)
	}
	if errors.Is(err, ConflictError) {
		return echo.NewHTTPError(http.StatusConflict, ConflictError.message)
	}
	if errors.Is(err, BadRequestError) {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	logrus.WithError(err).Error("unexpected error not handle")
	return echo.NewHTTPError(http.StatusInternalServerError, InternalError.message)
}
