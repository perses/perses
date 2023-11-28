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

	"github.com/labstack/echo/v4"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/shared/crypto"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/internal/api/shared/rbac"
	"github.com/perses/perses/internal/api/shared/utils"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
)

func ExtractParameters(ctx echo.Context) apiInterface.Parameters {
	return apiInterface.Parameters{
		Project: utils.GetProjectParameter(ctx),
		Name:    utils.GetNameParameter(ctx),
	}
}

// Toolbox is an interface that defines the different methods that can be used in the different endpoint of the API.
// This is a way to align the code of the different endpoint.
type Toolbox interface {
	Create(ctx echo.Context, entity api.Entity) error
	Update(ctx echo.Context, entity api.Entity) error
	Delete(ctx echo.Context) error
	Get(ctx echo.Context) error
	List(ctx echo.Context, q databaseModel.Query) error
	CheckPermission(ctx echo.Context, entity api.Entity, parameters apiInterface.Parameters, action role.Action) error
}

func NewToolBox(service apiInterface.Service, rbac rbac.RBAC, kind v1.Kind) Toolbox {
	return &toolbox{
		service: service,
		rbac:    rbac,
		kind:    kind,
	}
}

type toolbox struct {
	Toolbox
	service apiInterface.Service
	rbac    rbac.RBAC
	kind    v1.Kind
}

func (t *toolbox) CheckPermission(ctx echo.Context, entity api.Entity, parameters apiInterface.Parameters, action role.Action) error {
	projectName := parameters.Project
	claims := crypto.ExtractJWTClaims(ctx)
	if claims == nil {
		// Claims can be nil with anonymous endpoint and unauthenticated users, no need to continue
		return nil
	}
	scope, err := role.GetScope(string(t.kind))
	if err != nil {
		return err
	}
	if role.IsGlobalScope(*scope) {
		if ok := t.rbac.HasPermission(claims.Subject, action, rbac.GlobalProject, *scope); !ok {
			return HandleUnauthorizedError(fmt.Sprintf("missing '%s' global permission for '%s' kind", action, *scope))
		}
		return nil
	}

	// Project is not a global scope, in order to be attached to a Role (or GlobalRole) and have user able to delete their own projects
	if *scope == role.ProjectScope {
		// Create is still a "Global" only permission
		if action == role.CreateAction {
			if ok := t.rbac.HasPermission(claims.Subject, action, rbac.GlobalProject, *scope); !ok {
				return HandleUnauthorizedError(fmt.Sprintf("missing '%s' global permission for '%s' kind", action, *scope))
			}
			return nil
		}
		projectName = parameters.Name
	}

	if len(projectName) == 0 && entity != nil {
		// Retrieving project name from payload if project name not provided in the url
		projectName = utils.GetMetadataProject(entity.GetMetadata())
	}
	if ok := t.rbac.HasPermission(claims.Subject, action, projectName, *scope); !ok {
		return HandleUnauthorizedError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", action, projectName, *scope))

	}
	return nil
}

func (t *toolbox) Create(ctx echo.Context, entity api.Entity) error {
	if err := t.bind(ctx, entity); err != nil {
		return err
	}
	parameters := ExtractParameters(ctx)
	if err := t.CheckPermission(ctx, entity, parameters, role.CreateAction); err != nil {
		return err
	}
	newEntity, err := t.service.Create(apiInterface.NewPersesContext(ctx), entity)
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
	if err := t.CheckPermission(ctx, entity, parameters, role.UpdateAction); err != nil {
		return err
	}
	newEntity, err := t.service.Update(apiInterface.NewPersesContext(ctx), entity, parameters)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolbox) Delete(ctx echo.Context) error {
	parameters := ExtractParameters(ctx)
	if err := t.CheckPermission(ctx, nil, parameters, role.DeleteAction); err != nil {
		return err
	}
	if err := t.service.Delete(apiInterface.NewPersesContext(ctx), parameters); err != nil {
		return err
	}
	return ctx.NoContent(http.StatusNoContent)
}

func (t *toolbox) Get(ctx echo.Context) error {
	parameters := ExtractParameters(ctx)
	if err := t.CheckPermission(ctx, nil, parameters, role.ReadAction); err != nil {
		return err
	}
	entity, err := t.service.Get(apiInterface.NewPersesContext(ctx), parameters)
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
	if err := t.CheckPermission(ctx, nil, parameters, role.ReadAction); err != nil {
		return err
	}
	result, err := t.service.List(apiInterface.NewPersesContext(ctx), q, parameters)
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
