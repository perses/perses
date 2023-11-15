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
	"fmt"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/shared/authorization"
	"github.com/perses/perses/internal/api/shared/authorization/rbac"
	"github.com/perses/perses/internal/api/shared/crypto"
	"github.com/perses/perses/internal/api/shared/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"

	"github.com/labstack/echo/v4"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/pkg/model/api"
)

func extractParameters(ctx echo.Context) apiInterface.Parameters {
	return apiInterface.Parameters{
		Project: utils.GetProjectParameter(ctx),
		Name:    utils.GetNameParameter(ctx),
	}
}

func extractJWTClaims(ctx echo.Context) *crypto.JWTCustomClaims {
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

// Toolbox is an interface that defines the different methods that can be used in the different endpoint of the API.
// This is a way to align the code of the different endpoint.
type Toolbox interface {
	Create(ctx echo.Context, entity api.Entity) error
	Update(ctx echo.Context, entity api.Entity) error
	Delete(ctx echo.Context) error
	Get(ctx echo.Context) error
	List(ctx echo.Context, q databaseModel.Query) error
}

func NewToolBox(service apiInterface.Service, rbac authorization.RBAC, kind v1.Kind) Toolbox {
	return &toolbox{
		service: service,
		rbac:    rbac,
		kind:    kind,
	}
}

type toolbox struct {
	Toolbox
	service apiInterface.Service
	rbac    authorization.RBAC
	kind    v1.Kind
}

func (t *toolbox) CheckPermission(ctx echo.Context, entity api.Entity, projectName string, action v1.ActionKind) error {
	claims := extractJWTClaims(ctx)
	if v1.IsGlobal(t.kind) {
		if ok := t.rbac.HasPermission(claims.Subject, action, rbac.GlobalProject, t.kind); !ok {
			return HandleUnauthorizedError(fmt.Sprintf("missing '%s' global permission for '%s' kind", action, t.kind))
		}
		return nil
	}
	if len(projectName) == 0 && entity != nil {
		// Retrieving project name from payload if project name not provided in the url
		projectName = utils.GetMetadataProject(entity.GetMetadata())
	}
	if ok := t.rbac.HasPermission(claims.Subject, action, projectName, t.kind); !ok {
		return HandleUnauthorizedError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", action, projectName, t.kind))

	}
	return nil
}

func (t *toolbox) Create(ctx echo.Context, entity api.Entity) error {
	if err := t.bind(ctx, entity); err != nil {
		return err
	}
	parameters := extractParameters(ctx)
	if err := t.CheckPermission(ctx, entity, parameters.Project, v1.CreateAction); err != nil {
		return err
	}

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
	parameters := extractParameters(ctx)
	if err := t.CheckPermission(ctx, entity, parameters.Project, v1.UpdateAction); err != nil {
		return err
	}
	newEntity, err := t.service.Update(entity, parameters)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolbox) Delete(ctx echo.Context) error {
	parameters := extractParameters(ctx)

	if err := t.CheckPermission(ctx, nil, parameters.Project, v1.DeleteAction); err != nil {
		return err
	}
	if err := t.service.Delete(parameters); err != nil {
		return err
	}
	return ctx.NoContent(http.StatusNoContent)
}

func (t *toolbox) Get(ctx echo.Context) error {
	parameters := extractParameters(ctx)
	if err := t.CheckPermission(ctx, nil, parameters.Project, v1.ReadAction); err != nil {
		return err
	}
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
	parameters := extractParameters(ctx)
	if err := t.CheckPermission(ctx, nil, parameters.Project, v1.ReadAction); err != nil {
		return err
	}
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
	if err := utils.ValidateMetadata(ctx, entity.GetMetadata()); err != nil {
		return HandleBadRequestError(err.Error())
	}
	return nil
}
