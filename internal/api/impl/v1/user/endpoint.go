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

package user

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/rbac"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/toolbox"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type endpoint struct {
	toolbox       toolbox.Toolbox[*v1.User, *user.Query]
	rbac          rbac.RBAC
	security      crypto.Security
	readonly      bool
	disableSignUp bool
	caseSensitive bool
	localUsers    bool
}

func NewEndpoint(service user.Service, rbacService rbac.RBAC, securityService crypto.Security, disableSignUp bool, readonly bool, caseSensitive bool) route.Endpoint {
	localUsers := true
	if _, ok := rbacService.(rbac.K8sImpl); ok {
		localUsers = false
	}

	return &endpoint{
		toolbox:       toolbox.New[*v1.User, *v1.PublicUser, *user.Query](service, rbacService, securityService, v1.KindUser, caseSensitive),
		rbac:          rbacService,
		security:      securityService,
		readonly:      readonly,
		disableSignUp: disableSignUp,
		caseSensitive: caseSensitive,
		localUsers:    localUsers,
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	group := g.Group(fmt.Sprintf("/%s", utils.PathUser))

	group.GET(fmt.Sprintf("/:%s/permissions", utils.ParamName), e.GetPermissions, false)

	if e.localUsers {
		group.ANY("", e.disabled, true)
		return
	}

	if !e.readonly {
		if !e.disableSignUp {
			group.POST("", e.Create, true)
		}
		group.PUT(fmt.Sprintf("/:%s", utils.ParamName), e.Update, false)
		group.DELETE(fmt.Sprintf("/:%s", utils.ParamName), e.Delete, false)
	}
	group.GET("", e.List, false)
	group.GET(fmt.Sprintf("/:%s", utils.ParamName), e.Get, false)
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

func (e *endpoint) GetPermissions(ctx echo.Context) error {
	parameters := toolbox.ExtractParameters(ctx, e.caseSensitive)
	user := e.security.GetUser(ctx)
	if user == "" {
		return apiinterface.HandleUnauthorizedError("you need to be connected to retrieve your permissions")
	}
	nameParam, err := url.PathUnescape(parameters.Name)
	if err != nil || user != nameParam {
		return apiinterface.HandleForbiddenError("you can only retrieve your permissions")
	}
	permissions := e.rbac.GetPermissions(ctx, user)
	return ctx.JSON(http.StatusOK, permissions)
}

func (e *endpoint) disabled(ctx echo.Context) error {
	return apiinterface.HandleForbiddenError("endpoint is disabled when perses doesn't manage users")
}
