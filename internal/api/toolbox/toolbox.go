// Copyright 2024 The Perses Authors
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

package toolbox

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/sirupsen/logrus"
)

func ExtractParameters(ctx echo.Context, caseSensitive bool) apiInterface.Parameters {
	project := utils.GetProjectParameter(ctx)
	name := utils.GetNameParameter(ctx)
	if !caseSensitive {
		project = strings.ToLower(project)
		name = strings.ToLower(name)
	}
	return apiInterface.Parameters{
		Project: project,
		Name:    name,
	}
}

func isJSONContentType(ctx echo.Context) bool {
	contentType := ctx.Request().Header.Get(echo.HeaderContentType)
	if len(contentType) == 0 {
		return false
	}
	return strings.Contains(contentType, echo.MIMEApplicationJSON)
}

// Toolbox is an interface that defines the different methods that can be used in the different endpoint of the API.
// This is a way to align the code of the different endpoints.
type Toolbox[T api.Entity, K databaseModel.Query] interface {
	Create(ctx echo.Context, entity T) error
	Update(ctx echo.Context, entity T) error
	Delete(ctx echo.Context) error
	Get(ctx echo.Context) error
	List(ctx echo.Context, q K) error
}

func New[T api.Entity, K api.Entity, V databaseModel.Query](service apiInterface.Service[T, K, V], authz authorization.Authorization, kind v1.Kind, caseSensitive bool) Toolbox[T, V] {
	return &toolbox[T, K, V]{
		service:       service,
		authz:         authz,
		kind:          kind,
		caseSensitive: caseSensitive,
	}
}

type toolbox[T api.Entity, K api.Entity, V databaseModel.Query] struct {
	Toolbox[T, V]
	service       apiInterface.Service[T, K, V]
	authz         authorization.Authorization
	kind          v1.Kind
	caseSensitive bool
}

// checkPermissionList will verify only the permission for the List method. As you can see, scope is hardcoded.
// Use the generic checkPermission for any other purpose
func (t *toolbox[T, K, V]) checkPermissionList(ctx echo.Context, parameters apiInterface.Parameters, scope *role.Scope) error {
	if !t.authz.IsEnabled() {
		return nil
	}
	projectName := parameters.Project
	if role.IsGlobalScope(*scope) {
		if ok := t.authz.HasPermission(ctx, role.ReadAction, v1.WildcardProject, *scope); !ok {
			return apiInterface.HandleForbiddenError(fmt.Sprintf("missing '%s' global permission for '%s' kind", role.ReadAction, *scope))
		}
		return nil
	}
	if *scope == role.ProjectScope {
		projectName = parameters.Name
	}
	if len(projectName) == 0 {
		// In this particular context, the user would like to get every resource to every project he has access to.
		return nil
	}
	if ok := t.authz.HasPermission(ctx, role.ReadAction, projectName, *scope); !ok {
		return apiInterface.HandleForbiddenError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", role.ReadAction, projectName, *scope))
	}
	return nil
}

func (t *toolbox[T, K, V]) checkPermission(ctx echo.Context, entity api.Entity, parameters apiInterface.Parameters, action role.Action) error {
	if !t.authz.IsEnabled() {
		return nil
	}
	projectName := parameters.Project
	scope, err := role.GetScope(string(t.kind))
	if err != nil {
		return err
	}
	if role.IsGlobalScope(*scope) {
		if ok := t.authz.HasPermission(ctx, action, v1.WildcardProject, *scope); !ok {
			return apiInterface.HandleForbiddenError(fmt.Sprintf("missing '%s' global permission for '%s' kind", action, *scope))
		}
		return nil
	}

	// Project is not a global scope to be attached to a Role (or GlobalRole) and have user able to delete their own projects
	if *scope == role.ProjectScope {
		// Create is still a "Global" only permission
		if action == role.CreateAction {
			if ok := t.authz.HasPermission(ctx, action, v1.WildcardProject, *scope); !ok {
				return apiInterface.HandleForbiddenError(fmt.Sprintf("missing '%s' global permission for '%s' kind", action, *scope))
			}
			return nil
		}
		projectName = parameters.Name
	}

	if len(projectName) == 0 && entity != nil {
		// Retrieving project name from payload if project name not provided in the url
		projectName = utils.GetMetadataProject(entity.GetMetadata())
	}
	if ok := t.authz.HasPermission(ctx, action, projectName, *scope); !ok {
		return apiInterface.HandleForbiddenError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", action, projectName, *scope))
	}
	return nil
}

func (t *toolbox[T, K, V]) Create(ctx echo.Context, entity T) error {
	if err := t.bind(ctx, entity); err != nil {
		return err
	}
	parameters := ExtractParameters(ctx, t.caseSensitive)
	if err := t.checkPermission(ctx, entity, parameters, role.CreateAction); err != nil {
		return err
	}
	newEntity, err := t.service.Create(ctx, entity)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolbox[T, K, V]) Update(ctx echo.Context, entity T) error {
	if err := t.bind(ctx, entity); err != nil {
		return err
	}
	parameters := ExtractParameters(ctx, t.caseSensitive)
	if err := t.checkPermission(ctx, entity, parameters, role.UpdateAction); err != nil {
		return err
	}
	newEntity, err := t.service.Update(ctx, entity, parameters)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolbox[T, K, V]) Delete(ctx echo.Context) error {
	parameters := ExtractParameters(ctx, t.caseSensitive)
	if err := t.checkPermission(ctx, nil, parameters, role.DeleteAction); err != nil {
		return err
	}
	if err := t.service.Delete(ctx, parameters); err != nil {
		return err
	}
	return ctx.NoContent(http.StatusNoContent)
}

func (t *toolbox[T, K, V]) Get(ctx echo.Context) error {
	parameters := ExtractParameters(ctx, t.caseSensitive)
	if err := t.checkPermission(ctx, nil, parameters, role.ReadAction); err != nil {
		return err
	}
	entity, err := t.service.Get(parameters)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, entity)
}

func (t *toolbox[T, K, V]) List(ctx echo.Context, query V) error {
	if err := ctx.Bind(query); err != nil {
		return apiInterface.HandleBadRequestError(err.Error())
	}
	parameters := ExtractParameters(ctx, t.caseSensitive)

	list, listErr := t.list(ctx, parameters, query)
	if listErr != nil {
		return listErr
	}

	return ctx.JSON(http.StatusOK, list)
}

func (t *toolbox[T, K, V]) bind(ctx echo.Context, entity api.Entity) error {
	if !isJSONContentType(ctx) {
		return apiInterface.UnsupportedMediaType
	}
	if err := ctx.Bind(entity); err != nil {
		return apiInterface.HandleBadRequestError(err.Error())
	}
	entity.GetMetadata().Flatten(t.caseSensitive)
	if err := t.validateMetadata(ctx, entity.GetMetadata()); err != nil {
		return apiInterface.HandleBadRequestError(err.Error())
	}
	return nil
}

func (t *toolbox[T, K, V]) validateMetadata(ctx echo.Context, metadata api.Metadata) error {
	switch met := metadata.(type) {
	case *v1.Metadata:
		return t.validateMetadataVersusParameter(ctx, utils.ParamName, &met.Name)
	case *v1.ProjectMetadata:
		if err := t.validateMetadataVersusParameter(ctx, utils.ParamProject, &met.Project); err != nil {
			return err
		}
		return t.validateMetadataVersusParameter(ctx, utils.ParamName, &met.Name)
	}
	return nil
}

// validateMetadataVersusParameter is the generic method used to validate provided metadata against the parameters in the context
//   - If the parameter in the context is empty, no checks are performed => OK
//   - Else
//   - If metadata value is empty, it is overridden with the context value => OK
//   - Else
//   - If the values are not matching return an error => KO
//   - Else => OK
func (t *toolbox[T, K, V]) validateMetadataVersusParameter(ctx echo.Context, paramName string, metadataValue *string) error {
	paramValue := ctx.Param(paramName)
	if !t.caseSensitive {
		paramValue = strings.ToLower(paramValue)
	}
	if len(paramValue) > 0 {
		if len(*metadataValue) <= 0 {
			logrus.Debugf("overridden empty metadata value with %s parameter value '%s'", paramName, paramValue)
			*metadataValue = paramValue
		} else {
			if *metadataValue != paramValue {
				return fmt.Errorf("%s parameter value '%s' does not match provided metadata value '%s'", paramName, paramValue, *metadataValue)
			}
		}
	}
	return nil
}
