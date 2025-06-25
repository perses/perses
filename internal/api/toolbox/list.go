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
	"encoding/json"
	"fmt"

	"github.com/brunoga/deep"
	"github.com/labstack/echo/v4"
	"github.com/perses/common/async"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/tidwall/gjson"
)

func buildMapFromList[T api.Entity](list []T) map[string]T {
	result := make(map[string]T)
	for _, item := range list {
		result[item.GetMetadata().GetName()] = item
	}
	return result
}

func buildRawMapFromList(rows []json.RawMessage) map[string]json.RawMessage {
	result := make(map[string]json.RawMessage)
	for _, item := range rows {
		result[gjson.GetBytes(item, "metadata.name").String()] = item
	}
	return result
}

func (t *toolbox[T, K, V]) list(ctx echo.Context, parameters apiInterface.Parameters, query V) (any, error) {
	if t.authz.IsEnabled() {
		// When permission is activated, the list is filtered based on what the user has access to.
		// It considered multiple different cases, so that's why it's treated in a separated function.
		return t.listWhenPermissionIsActivated(ctx, parameters, query)
	}
	return t.metadataOrFullList(parameters, query)
}

func (t *toolbox[T, K, V]) listWhenPermissionIsActivated(ctx echo.Context, parameters apiInterface.Parameters, q V) (any, error) {
	scope, err := role.GetScope(string(t.kind))
	if err != nil {
		return nil, err
	}
	if permErr := t.checkPermissionList(ctx, parameters, scope); permErr != nil {
		return nil, permErr
	}
	// Get the list of the project the user has access to, depending on the current scope.
	projects, err := t.authz.GetUserProjects(ctx, role.ReadAction, *scope)
	if err != nil {
		return nil, err
	}

	// If there is no project associated with the user, then we should just return an empty list.
	if len(projects) == 0 {
		return []api.Entity{}, nil
	}

	// Special case if the user is getting the list of the project, as "project" is not considered has a global scope.
	// More explanation about why it's not a global scope available here: https://github.com/perses/perses/blob/611b7993257dcadb18d48de945ad4def18889bec/pkg/model/api/v1/role/scope.go#L137-L138
	if *scope == role.ProjectScope {
		return t.listProjectWhenPermissionIsActivated(parameters, projects, q)
	}

	// In the case the request is done on a specific project, no need to compute resource for all other authorized projects.
	if len(parameters.Project) > 0 {
		return t.metadataOrFullList(parameters, q)
	}

	// In case, there is one result; it can mean the user has global access to the resource across the project.
	// Or it can mean he has access to only one project. If he has global access, then we should return the complete list.
	if len(projects) == 1 && projects[0] == modelV1.WildcardProject {
		return t.metadataOrFullList(parameters, q)
	}

	result := make([]any, 0, len(projects))
	asynchronousRequests := make([]async.Future[any], 0, len(projects))
	for _, project := range projects {
		asynchronousRequests = append(asynchronousRequests, async.Async(t.asyncMetadataOrFullList(parameters, project, q)))
	}
	for _, request := range asynchronousRequests {
		listResult, requestErr := request.Await()
		if requestErr != nil {
			return nil, requestErr
		}
		switch typedList := listResult.(type) {
		case []api.Entity:
			for _, entity := range typedList {
				result = append(result, entity)
			}
		case []K:
			for _, entity := range typedList {
				result = append(result, entity)
			}
		case []json.RawMessage:
			for _, entity := range typedList {
				result = append(result, entity)
			}
		}
	}
	return result, nil
}

func (t *toolbox[T, K, V]) listProjectWhenPermissionIsActivated(parameters apiInterface.Parameters, projects []string, query V) (any, error) {
	// User has global access to all projects and should get the complete list.
	if projects[0] == modelV1.WildcardProject {
		return t.metadataOrFullList(parameters, query)
	}

	// Last case, we want the list of the project that matches what the user has access to.
	// So we get the list from the database, and then we keep only that one that matches the list extracted from the permission.
	// The usage of the map is just to avoid having the o(n2) complexity by looping over two lists to make the intersection.
	projectList, listErr := t.metadataOrFullList(parameters, query)
	if listErr != nil {
		return nil, listErr
	}

	switch typedList := projectList.(type) {
	case []K:
		result := make([]K, 0, len(typedList))
		buildMap := buildMapFromList(typedList)
		for _, project := range projects {
			result = append(result, buildMap[project])
		}
		return result, nil
	case []api.Entity:
		result := make([]api.Entity, 0, len(typedList))
		buildMap := buildMapFromList(typedList)
		for _, project := range projects {
			result = append(result, buildMap[project])
		}
		return result, nil
	case []json.RawMessage:
		result := make([]json.RawMessage, 0, len(typedList))
		buildMap := buildRawMapFromList(typedList)
		for _, project := range projects {
			result = append(result, buildMap[project])
		}
		return result, nil
	}
	return []interface{}{}, nil
}

func (t *toolbox[T, K, V]) metadataOrFullList(parameters apiInterface.Parameters, query V) (any, error) {
	if query.GetMetadataOnlyQueryParam() {
		if query.IsRawMetadataQueryAllowed() {
			return t.service.RawMetadataList(query, parameters)
		}
		return t.service.MetadataList(query, parameters)
	}
	if query.IsRawQueryAllowed() {
		return t.service.RawList(query, parameters)
	}
	return t.service.List(query, parameters)
}

func (t *toolbox[T, K, V]) asyncMetadataOrFullList(parameters apiInterface.Parameters, project string, query V) func() (any, error) {
	return func() (any, error) {
		param, err := deep.Copy(parameters)
		if err != nil {
			return [][]byte{}, fmt.Errorf("unable to copy the parameters: %w", err)
		}
		param.Project = project
		return t.metadataOrFullList(param, query)
	}
}
