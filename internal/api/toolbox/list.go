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
	"github.com/labstack/echo/v4"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/rbac"
	"github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/role"
)

func buildMapFromList[T api.Entity](list []T) map[string]T {
	result := make(map[string]T)
	for _, item := range list {
		result[item.GetMetadata().GetName()] = item
	}
	return result
}

func (t *toolbox[T, K, V]) list(ctx echo.Context, parameters apiInterface.Parameters, query V) ([]K, error) {
	if t.rbac.IsEnabled() {
		// When permission is activated, the list is filtered based on what the user has access to.
		// It considered multiple different cases, so that's why it's treated in a separated function.
		return t.listWhenPermissionIsActivated(ctx, parameters, query)
	}
	return t.service.List(apiInterface.NewPersesContext(ctx), query, parameters)
}

func (t *toolbox[T, K, V]) listWhenPermissionIsActivated(ctx echo.Context, parameters apiInterface.Parameters, q V) ([]K, error) {
	scope, err := role.GetScope(string(t.kind))
	if err != nil {
		return nil, err
	}
	if permErr := t.checkPermissionList(ctx, parameters, scope); permErr != nil {
		return nil, permErr
	}
	persesContext := apiInterface.NewPersesContext(ctx)
	// Get the list of the project the user has access to, depending on the current scope.
	projects := t.rbac.GetUserProjects(persesContext.GetUsername(), role.ReadAction, *scope)

	// If there is no project associated to the user, then we should just return an empty list.
	if len(projects) == 0 {
		return []K{}, nil
	}

	// Special case if the user is getting the list of the project, as "project" is not considered has a global scope.
	// More explanation about why it's not a global scope available here: https://github.com/perses/perses/blob/611b7993257dcadb18d48de945ad4def18889bec/pkg/model/api/v1/role/scope.go#L137-L138
	if *scope == role.ProjectScope {
		return t.listProjectWhenPermissionIsActivated(parameters, persesContext, projects, q)
	}

	// In the case the request is done on a specific project, no need to compute resource for all other authorized projects.
	if len(parameters.Project) > 0 {
		return t.service.List(persesContext, q, parameters)
	}

	// In case, there is one result; it can mean the user has global access to the resource across the project.
	// Or it can mean he has access to only one project. If he has global access, then we should return the complete list.
	if len(projects) == 1 && projects[0] == rbac.GlobalProject {
		return t.service.List(persesContext, q, parameters)
	}

	var result []K
	for _, project := range projects {
		parameters.Project = project
		listResult, listErr := t.service.List(persesContext, q, parameters)
		if listErr != nil {
			return nil, listErr
		}
		result = append(result, listResult...)
	}
	return result, nil
}

func (t *toolbox[T, K, V]) listProjectWhenPermissionIsActivated(parameters apiInterface.Parameters, persesContext apiInterface.PersesContext, projects []string, query V) ([]K, error) {
	// User has global access to all projects and should get the complete list.
	if projects[0] == rbac.GlobalProject {
		return t.service.List(persesContext, query, parameters)
	}

	// Last case, we want the list of the project that matches what the user has access to.
	// So we get the list from the database, and then we keep only that one that matches the list extracted from the permission.
	// The usage of the map is just to avoid having the o(n2) complexity by looping over two lists to make the intersection.
	var result []K
	projectList, listErr := t.service.List(persesContext, query, parameters)
	if listErr != nil {
		return nil, listErr
	}
	projectMap := buildMapFromList(projectList)
	for _, project := range projects {
		result = append(result, projectMap[project])
	}
	return result, nil
}
