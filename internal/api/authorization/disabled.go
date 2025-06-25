// Copyright 2025 The Perses Authors
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

package authorization

import (
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
)

type disabledImpl struct {
	Authorization
}

func (r *disabledImpl) IsEnabled() bool {
	return false
}

func (r *disabledImpl) GetUser(_ echo.Context) (any, error) {
	return nil, nil
}

func (r *disabledImpl) GetUsername(_ echo.Context) (string, error) {
	return "", nil
}

func (r *disabledImpl) Middleware(_ middleware.Skipper) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ctx echo.Context) error {
			return next(ctx)
		}
	}
}

func (r *disabledImpl) GetUserProjects(_ echo.Context, _ v1Role.Action, _ v1Role.Scope) ([]string, error) {
	return []string{}, nil
}

func (r *disabledImpl) HasPermission(_ echo.Context, _ v1Role.Action, _ string, _ v1Role.Scope) bool {
	return true
}

func (r *disabledImpl) GetPermissions(_ echo.Context) (map[string][]*v1Role.Permission, error) {
	return nil, nil
}

func (r *disabledImpl) RefreshPermissions() error {
	return nil
}
