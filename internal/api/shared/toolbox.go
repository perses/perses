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

package shared

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/perses/perses/internal/api/shared/authorization"
	"github.com/perses/perses/internal/api/shared/authorization/rbac"
	"github.com/perses/perses/internal/api/shared/crypto"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"net/http"

	"github.com/labstack/echo/v4"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/pkg/model/api"
)

type Parameters struct {
	Project string
	Name    string
}

func ExtractParameters(ctx echo.Context) Parameters {
	return Parameters{
		Project: GetProjectParameter(ctx),
		Name:    GetNameParameter(ctx),
	}
}

func ExtractJWTClaims(ctx echo.Context) *crypto.JWTCustomClaims {
	jwtToken, ok := ctx.Get("user").(*jwt.Token) // by default token is stored under `user` key
	if !ok {
		return nil
	}

	claims, ok := jwtToken.Claims.(*crypto.JWTCustomClaims)
	if !ok {
		return nil
	}
	return claims
}

type ToolboxService interface {
	Create(entity api.Entity) (interface{}, error)
	Update(entity api.Entity, parameters Parameters) (interface{}, error)
	Delete(parameters Parameters) error
	Get(parameters Parameters) (interface{}, error)
	List(q databaseModel.Query, parameters Parameters) (interface{}, error)
}

// Toolbox is an interface that defines the different methods that can be used in the different endpoint of the API.
// This is a way to align the code of the different endpoint.
type Toolbox interface {
	Create(ctx echo.Context, entity api.Entity) error
	Update(ctx echo.Context, entity api.Entity) error
	Delete(ctx echo.Context) error
	Get(ctx echo.Context) error
	List(ctx echo.Context, q databaseModel.Query) error
}

func NewToolBox(service ToolboxService, rbac authorization.RBAC, kind v1.Kind) Toolbox {
	return &toolbox{
		service: service,
		rbac:    rbac,
		kind:    kind,
	}
}

type toolbox struct {
	Toolbox
	service ToolboxService
	rbac    authorization.RBAC
	kind    v1.Kind
}

func (t *toolbox) HasPermission(ctx echo.Context, entity api.Entity, projectName string, action v1.ActionKind) bool {
	claims := ExtractJWTClaims(ctx)
	if v1.IsGlobal(t.kind) {
		return t.rbac.HasPermission(claims.Subject, action, rbac.GlobalProject, t.kind)
	}
	if len(projectName) == 0 {
		// Retrieving project name from payload if project name not provided in the url
		projectName = GetMetadataProject(entity.GetMetadata())
	}
	return t.rbac.HasPermission(claims.Subject, action, projectName, t.kind)
}

func (t *toolbox) Create(ctx echo.Context, entity api.Entity) error {
	if err := t.bind(ctx, entity); err != nil {
		return err
	}
	parameters := ExtractParameters(ctx)
	t.HasPermission(ctx, entity, parameters.Project, v1.CreateAction)

	newEntity, err := t.service.Create(entity)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolbox) Update(ctx echo.Context, entity api.Entity) error {
	if err := t.bind(ctx, entity); err != nil {
		return err
	}
	parameters := ExtractParameters(ctx)
	t.HasPermission(ctx, entity, parameters.Project, v1.UpdateAction)
	newEntity, err := t.service.Update(entity, parameters)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolbox) Delete(ctx echo.Context) error {
	parameters := ExtractParameters(ctx)

	t.HasPermission(ctx, nil, parameters.Project, v1.CreateAction)
	if err := t.service.Delete(parameters); err != nil {
		return err
	}
	return ctx.NoContent(http.StatusNoContent)
}

func (t *toolbox) Get(ctx echo.Context) error {
	parameters := ExtractParameters(ctx)
	t.HasPermission(ctx, nil, parameters.Project, v1.CreateAction)
	entity, err := t.service.Get(parameters)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, entity)
}

func (t *toolbox) List(ctx echo.Context, q databaseModel.Query) error {
	if err := ctx.Bind(q); err != nil {
		return HandleBadRequestError(err.Error())
	}
	parameters := ExtractParameters(ctx)
	t.HasPermission(ctx, nil, parameters.Project, v1.CreateAction)
	result, err := t.service.List(q, parameters)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, result)
}

func (t *toolbox) bind(ctx echo.Context, entity api.Entity) error {
	if err := ctx.Bind(entity); err != nil {
		return HandleBadRequestError(err.Error())
	}
	if err := validateMetadata(ctx, entity.GetMetadata()); err != nil {
		return HandleBadRequestError(err.Error())
	}
	return nil
}
