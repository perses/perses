// Copyright 2023 The Perses Authors
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

// Code generated. DO NOT EDIT

package user

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/toolbox"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type endpoint struct {
	toolbox       toolbox.Toolbox[*v1.User, *user.Query]
	authz         authorization.Authorization
	readonly      bool
	disableSignUp bool
	caseSensitive bool
}

func NewEndpoint(service user.Service, authz authorization.Authorization, disableSignUp bool, readonly bool, caseSensitive bool) route.Endpoint {
	return &endpoint{
		toolbox:       toolbox.New[*v1.User, *v1.PublicUser, *user.Query](service, authz, v1.KindUser, caseSensitive),
		authz:         authz,
		readonly:      readonly,
		disableSignUp: disableSignUp,
		caseSensitive: caseSensitive,
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	// General users group is used for general manipulation of users
	// It's used with /api/v1/users/{user}/... paths
	generalUsersGroup := g.Group(fmt.Sprintf("/%s", utils.PathUser))

	if !e.readonly {
		if !e.disableSignUp {
			generalUsersGroup.POST("", e.Create, true)
		}
		generalUsersGroup.PUT(fmt.Sprintf("/:%s", utils.ParamName), e.Update, false)
		generalUsersGroup.DELETE(fmt.Sprintf("/:%s", utils.ParamName), e.Delete, false)
	}
	generalUsersGroup.GET("", e.List, false)
	generalUsersGroup.GET(fmt.Sprintf("/:%s", utils.ParamName), e.Get, false)
	generalUsersGroup.GET(fmt.Sprintf("/:%s/permissions", utils.ParamName), e.GetPermissions, false)

	// Current user group is used for operations on the current authenticated user
	// It's used with /api/v1/user/... paths
	currentUserGroup := g.Group(fmt.Sprintf("/%s", utils.PathCurrentUser))
	currentUserGroup.GET(fmt.Sprintf("/%s", utils.PathWhoAmI), e.WhoAmI, false)
}

func (e *endpoint) Create(ctx echo.Context) error {
	entity := &v1.User{}
	return e.toolbox.Create(ctx, entity)
}

func (e *endpoint) Update(ctx echo.Context) error {
	entity := &v1.User{}
	return e.toolbox.Update(ctx, entity)
}

func (e *endpoint) Delete(ctx echo.Context) error {
	return e.toolbox.Delete(ctx)
}

func (e *endpoint) Get(ctx echo.Context) error {
	return e.toolbox.Get(ctx)
}

func (e *endpoint) List(ctx echo.Context) error {
	q := &user.Query{}
	return e.toolbox.List(ctx, q)
}

func (e *endpoint) WhoAmI(ctx echo.Context) error {
	if !e.authz.IsEnabled() {
		return apiinterface.HandleUnauthorizedError("authentication is required to retrieve user permissions")
	}
	publicUser, err := e.authz.GetPublicUser(ctx)
	if err != nil || publicUser.Metadata.GetName() == "" {
		return apiinterface.HandleUnauthorizedError("failed to retrieve user information from context")
	}
	return ctx.JSON(http.StatusOK, publicUser)
}

func (e *endpoint) GetPermissions(ctx echo.Context) error {
	parameters := toolbox.ExtractParameters(ctx, e.caseSensitive)
	// Since delegated authentication usernames (k8s) can contain colons and other characters with conflict
	// with url standards, the urls containing usernames with them will be % encoded, so
	// we need to decode the username url path to check against the authentication
	// values sent with the request
	paramUsername, err := url.PathUnescape(parameters.Name)
	if err != nil {
		return err
	}
	if !e.authz.IsEnabled() {
		return apiinterface.HandleUnauthorizedError("authentication is required to retrieve user permissions")
	}
	username, err := e.authz.GetUsername(ctx)
	if err != nil {
		return apiinterface.HandleUnauthorizedError("failed to retrieve username from context")
	}
	if username != paramUsername {
		return apiinterface.HandleForbiddenError("you can only retrieve your permissions")
	}
	permissions, err := e.authz.GetPermissions(ctx)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, permissions)
}
