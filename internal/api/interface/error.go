// Copyright 2021 The Perses Authors
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
	"errors"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/sirupsen/logrus"
)

type PersesError struct {
	message string
}

func (e *PersesError) Error() string {
	return e.message
}

var (
	InternalError     = &PersesError{message: "internal server error"}
	NotFoundError     = &PersesError{message: "document not found"}
	ConflictError     = &PersesError{message: "document already exists"}
	BadRequestError   = &PersesError{message: "bad request"}
	UnauthorizedError = &PersesError{message: "unauthorized"}
	ForbiddenError    = &PersesError{message: "forbidden access"}
)

// HandleError is translating the given error to the echoHTTPError
func HandleError(err error) error {
	if err == nil {
		return nil
	}

	if databaseModel.IsKeyNotFound(err) {
		return echo.NewHTTPError(http.StatusNotFound, NotFoundError.message)
	}
	if databaseModel.IsKeyConflict(err) {
		return echo.NewHTTPError(http.StatusConflict, ConflictError.message)
	}

	if errors.Is(err, InternalError) {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if errors.Is(err, ConflictError) {
		return echo.NewHTTPError(http.StatusConflict, err.Error())
	}
	if errors.Is(err, NotFoundError) {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}
	if errors.Is(err, BadRequestError) {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if errors.Is(err, UnauthorizedError) {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}
	if errors.Is(err, ForbiddenError) {
		return echo.NewHTTPError(http.StatusForbidden, err.Error())
	}

	var HTTPError *echo.HTTPError
	if errors.As(err, &HTTPError) {
		// The error is coming from the echo framework likely because the route doesn't exist.
		// In this particular case, we shouldn't touch to the error and let it like that
		return err
	}
	logrus.WithError(err).Error("unexpected error not handle")
	return echo.NewHTTPError(http.StatusInternalServerError, InternalError.message)
}

func HandleNotFoundError(msg string) error {
	return handleErrorMsg(msg, NotFoundError)
}

func HandleBadRequestError(msg string) error {
	return handleErrorMsg(msg, BadRequestError)
}

func HandleUnauthorizedError(msg string) error {
	return handleErrorMsg(msg, UnauthorizedError)
}

func HandleForbiddenError(msg string) error {
	return handleErrorMsg(msg, ForbiddenError)
}

func handleErrorMsg(msg string, err *PersesError) error {
	return fmt.Errorf("%w: %s", err, msg)
}
