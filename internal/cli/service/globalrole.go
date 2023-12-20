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

package service

import (
	"strings"

	"github.com/perses/perses/internal/cli/output"
	v1 "github.com/perses/perses/pkg/client/api/v1"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	apiRole "github.com/perses/perses/pkg/model/api/v1/role"
)

// buildPermissionMatrix is transforming a list of permissions into a matrix that will be displayed later.
// permissions is the list of permissions we want to display in the matrix
// spaces is the number of empty columns we need to have before starting to display the action.
// firstLine is the line containing the name of the role, and the creation date
// matrix is the final matrix we need to feed
func buildPermissionMatrix(permissions []apiRole.Permission, spaces []string, firstLine []string, matrix [][]string) [][]string {
	isFirstLine := true
	for _, permission := range permissions {
		var currentActionLine []string
		if isFirstLine {
			currentActionLine = firstLine
			isFirstLine = false
		} else {
			currentActionLine = spaces
		}
		var actions []string
		for _, action := range permission.Actions {
			actions = append(actions, string(action))
		}
		currentActionLine = append(currentActionLine, strings.Join(actions, ","))

		firstScopeLine := true
		for _, scope := range permission.Scopes {
			var currentScopeLine []string
			if firstScopeLine {
				currentScopeLine = currentActionLine
				firstScopeLine = false
			} else {
				currentScopeLine = append(currentScopeLine, spaces...)
				currentScopeLine = append(currentScopeLine, "")
			}
			currentScopeLine = append(currentScopeLine, string(scope))
			matrix = append(matrix, currentScopeLine)
		}
	}
	return matrix
}

type globalRole struct {
	Service
	apiClient v1.GlobalRoleInterface
}

func (g *globalRole) CreateResource(entity modelAPI.Entity) (modelAPI.Entity, error) {
	return g.apiClient.Create(entity.(*modelV1.GlobalRole))
}

func (g *globalRole) UpdateResource(entity modelAPI.Entity) (modelAPI.Entity, error) {
	return g.apiClient.Update(entity.(*modelV1.GlobalRole))
}

func (g *globalRole) ListResource(prefix string) ([]modelAPI.Entity, error) {
	return convertToEntityIfNoError(g.apiClient.List(prefix))
}

func (g *globalRole) GetResource(name string) (modelAPI.Entity, error) {
	return g.apiClient.Get(name)
}

func (g *globalRole) DeleteResource(name string) error {
	return g.apiClient.Delete(name)
}

func (g *globalRole) BuildMatrix(hits []modelAPI.Entity) [][]string {
	var data [][]string
	for _, hit := range hits {
		entity := hit.(*modelV1.GlobalRole)
		line := []string{
			entity.Metadata.Name,
			output.FormatTime(entity.Metadata.UpdatedAt),
		}

		data = buildPermissionMatrix(entity.Spec.Permissions, []string{"", ""}, line, data)
	}
	return data
}

func (g *globalRole) GetColumHeader() []string {
	return []string{
		"NAME",
		"AGE",
		"ACTIONS",
		"SCOPE",
	}
}
