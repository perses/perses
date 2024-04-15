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

package toolbox

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/rbac"
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

func buildMapFromList[T api.Entity](list []T) map[string]T {
	result := make(map[string]T)
	for _, item := range list {
		result[item.GetMetadata().GetName()] = item
	}
	return result
}

// Toolbox is an interface that defines the different methods that can be used in the different endpoint of the API.
// This is a way to align the code of the different endpoint.
type Toolbox[T api.Entity, K databaseModel.Query] interface {
	Create(ctx echo.Context, entity T) error
	Update(ctx echo.Context, entity T) error
	Delete(ctx echo.Context) error
	Get(ctx echo.Context) error
	List(ctx echo.Context, q K) error
}

func New[T api.Entity, K api.Entity, V databaseModel.Query](service apiInterface.Service[T, K, V], rbac rbac.RBAC, kind v1.Kind, caseSensitive bool) Toolbox[T, V] {
	return &toolbox[T, K, V]{
		service:       service,
		rbac:          rbac,
		kind:          kind,
		caseSensitive: caseSensitive,
	}
}

type toolbox[T api.Entity, K api.Entity, V databaseModel.Query] struct {
	Toolbox[T, K]
	service       apiInterface.Service[T, K, V]
	rbac          rbac.RBAC
	kind          v1.Kind
	caseSensitive bool
}

// checkPermissionList will verify only the permission for the List method. As you can see, scope is hardcoded.
// Use the generic checkPermission for any other purpose
func (t *toolbox[T, K, V]) checkPermissionList(ctx echo.Context, parameters apiInterface.Parameters, scope *role.Scope) error {
	projectName := parameters.Project
	claims := crypto.ExtractJWTClaims(ctx)
	if claims == nil {
		// Claims can be nil with anonymous endpoint and unauthenticated users, no need to continue
		return nil
	}
	if role.IsGlobalScope(*scope) {
		if ok := t.rbac.HasPermission(claims.Subject, role.ReadAction, rbac.GlobalProject, *scope); !ok {
			return apiInterface.HandleUnauthorizedError(fmt.Sprintf("missing '%s' global permission for '%s' kind", role.ReadAction, *scope))
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
	if ok := t.rbac.HasPermission(claims.Subject, role.ReadAction, projectName, *scope); !ok {
		return apiInterface.HandleUnauthorizedError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", role.ReadAction, projectName, *scope))
	}
	return nil
}

func (t *toolbox[T, K, V]) checkPermission(ctx echo.Context, entity api.Entity, parameters apiInterface.Parameters, action role.Action) error {
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
			return apiInterface.HandleUnauthorizedError(fmt.Sprintf("missing '%s' global permission for '%s' kind", action, *scope))
		}
		return nil
	}

	// Project is not a global scope, in order to be attached to a Role (or GlobalRole) and have user able to delete their own projects
	if *scope == role.ProjectScope {
		// Create is still a "Global" only permission
		if action == role.CreateAction {
			if ok := t.rbac.HasPermission(claims.Subject, action, rbac.GlobalProject, *scope); !ok {
				return apiInterface.HandleUnauthorizedError(fmt.Sprintf("missing '%s' global permission for '%s' kind", action, *scope))
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
		return apiInterface.HandleUnauthorizedError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", action, projectName, *scope))
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
	newEntity, err := t.service.Create(apiInterface.NewPersesContext(ctx), entity)
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
	newEntity, err := t.service.Update(apiInterface.NewPersesContext(ctx), entity, parameters)
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
	if err := t.service.Delete(apiInterface.NewPersesContext(ctx), parameters); err != nil {
		return err
	}
	return ctx.NoContent(http.StatusNoContent)
}

func (t *toolbox[T, K, V]) Get(ctx echo.Context) error {
	parameters := ExtractParameters(ctx, t.caseSensitive)
	if err := t.checkPermission(ctx, nil, parameters, role.ReadAction); err != nil {
		return err
	}
	entity, err := t.service.Get(apiInterface.NewPersesContext(ctx), parameters)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, entity)
}

func (t *toolbox[T, K, V]) List(ctx echo.Context, q V) error {
	if err := ctx.Bind(q); err != nil {
		return apiInterface.HandleBadRequestError(err.Error())
	}
	parameters := ExtractParameters(ctx, t.caseSensitive)

	if t.rbac.IsEnabled() {
		// When permission is activated, the list is basically filtered based on what the user has access to.
		// It considered multiple different cases, so that's why it's treated in a separated function.
		return t.listWhenPermissionIsActivated(ctx, parameters, q)
	}
	result, listErr := t.service.List(apiInterface.NewPersesContext(ctx), q, parameters)
	if listErr != nil {
		return listErr
	}
	return ctx.JSON(http.StatusOK, result)
}

func (t *toolbox[T, K, V]) listWhenPermissionIsActivated(ctx echo.Context, parameters apiInterface.Parameters, q V) error {
	scope, err := role.GetScope(string(t.kind))
	if err != nil {
		return err
	}
	if permErr := t.checkPermissionList(ctx, parameters, scope); permErr != nil {
		return permErr
	}
	persesContext := apiInterface.NewPersesContext(ctx)
	// Get the list of the project the user has access to, depending on the current scope.
	projects := t.rbac.GetUserProjects(persesContext.GetUsername(), role.ReadAction, *scope)

	// If there is no project associated to the user, then we should just return an empty list.
	if len(projects) == 0 {
		return ctx.JSON(http.StatusOK, []string{})
	}

	// Special case if the user is getting the list of the project, as "project" is not considered has a global scope.
	// More explanation about why it's not a global scope available here: https://github.com/perses/perses/blob/611b7993257dcadb18d48de945ad4def18889bec/pkg/model/api/v1/role/scope.go#L137-L138
	if *scope == role.ProjectScope {
		return t.listProjectWhenPermissionIsActivated(ctx, parameters, persesContext, projects, q)
	}

	// In case, there is one result; it can mean the user has global access to the resource across the project.
	// Or it can mean he has access to only one project. If he has global access, then the value parameters.Project is empty.
	// So when running the query in the database, it will be done across the whole table (i.e. with no project filtering)
	if len(projects) == 1 {
		if projects[0] != rbac.GlobalProject {
			parameters.Project = projects[0]
		}
		result, listErr := t.service.List(persesContext, q, parameters)
		if listErr != nil {
			return listErr
		}
		return ctx.JSON(http.StatusOK, result)
	}

	var result []K
	for _, project := range projects {
		parameters.Project = project
		listResult, listErr := t.service.List(persesContext, q, parameters)
		if listErr != nil {
			return listErr
		}
		result = append(result, listResult...)
	}
	return ctx.JSON(http.StatusOK, result)
}

func (t *toolbox[T, K, V]) listProjectWhenPermissionIsActivated(ctx echo.Context, parameters apiInterface.Parameters, persesContext apiInterface.PersesContext, projects []string, q V) error {
	// User has global access to all projects and should get the complete list.
	if projects[0] == rbac.GlobalProject {
		result, listErr := t.service.List(persesContext, q, parameters)
		if listErr != nil {
			return listErr
		}
		return ctx.JSON(http.StatusOK, result)
	}

	// Last case, we want the list of the project that matches what the user has access to.
	// So we get the list from the database, and then we keep only that one that matches the list extracted from the permission.
	// The usage of the map is just to avoid having the o(n2) complexity by looping over two lists to make the intersection.
	var result []K
	projectList, listErr := t.service.List(persesContext, q, parameters)
	if listErr != nil {
		return listErr
	}
	projectMap := buildMapFromList(projectList)
	for _, project := range projects {
		result = append(result, projectMap[project])
	}
	return ctx.JSON(http.StatusOK, result)
}

func (t *toolbox[T, K, V]) bind(ctx echo.Context, entity api.Entity) error {
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
