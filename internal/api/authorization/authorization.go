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
	"github.com/perses/perses/internal/api/authorization/native"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/pkg/model/api/config"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
)

type Authorization interface {
	// IsEnabled returns true if the authorization is enabled, false otherwise.
	IsEnabled() bool
	// GetUser returns the user information from the context. The user information will depend on the implementation.
	// While implementing this method, consider that the user information is not guaranteed to be set in the context.
	// You should consider the case where the context can be empty and that the function can be called from an anonymous endpoint.
	// To check if it is called from an anonymous endpoint, you can use the function utils.IsAnonymous.
	// In case the context is not empty, and it is not an anonymous endpoint, the user information should be set in the context.
	// If it is not the case, you should return an error.
	GetUser(ctx echo.Context) (any, error)
	// GetUsername returns the username/the login of the user from the context.
	GetUsername(ctx echo.Context) (string, error)
	// Middleware returns the middleware function to be used in the echo server.
	// This middleware is responsible for finding the token in the request, validating it and extracting it in the context.
	// In case the token is not valid, it will prevent the request from being processed and return an error.
	// The middleware should be used before any other middleware that requires the user information to be set in the context.
	Middleware(skipper middleware.Skipper) echo.MiddlewareFunc
	// GetUserProjects returns the list of the project the user has access to in the context of the role and the scope requested.
	// Be aware that this function cannot be called from an anonymous endpoint.
	// In case the user information is not found in the context, the implementation should return an error.
	GetUserProjects(ctx echo.Context, requestAction v1Role.Action, requestScope v1Role.Scope) ([]string, error)
	// HasPermission checks if the user has the permission to perform the action on the project with the given scope.
	// In case the endpoint is anonymous, or the context is empty, it will return true.
	// In case the user information is not found in the context, the implementation should return false.
	HasPermission(ctx echo.Context, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool
	// GetPermissions returns the permissions of the user found in the context.
	// Be aware that this function cannot be called from an anonymous endpoint.
	// In case the user information is not found in the context, the implementation should return an error.
	GetPermissions(ctx echo.Context) (map[string][]*v1Role.Permission, error)
	// RefreshPermissions refreshes the permissions.
	// We know this method is relative to the implementation and should not appear in the interface.
	// This is convenient to have it here when the implementation is keeping the permissions in memory.
	// And since it is a single method, it does not hurt to have it in the interface as it is straight forward to implement it if it's unnecessary.
	// Just return nil.
	RefreshPermissions() error
}

func New(userDAO user.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO,
	globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO, conf config.Config) (Authorization, error) {
	if !conf.Security.EnableAuth {
		return &disabledImpl{}, nil
	}
	return native.New(userDAO, roleDAO, roleBindingDAO, globalRoleDAO, globalRoleBindingDAO, conf)
}
