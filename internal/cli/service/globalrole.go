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
	"github.com/perses/perses/internal/cli/output"
	v1 "github.com/perses/perses/pkg/client/api/v1"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

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

		if len(entity.Spec.Permissions) == 0 {
			line = append(line, "EMPTY", "EMPTY")
			data = append(data, line)
			continue
		}

		firstLine := true
		for _, permission := range entity.Spec.Permissions {
			if len(permission.Scopes) == 0 {
				line = append(line, string(permission.Action), "EMPTY")
				data = append(data, line)
				continue
			}

			for _, scope := range permission.Scopes {
				if firstLine {
					line = append(line, string(permission.Action), string(scope))
					data = append(data, line)
					firstLine = false
					continue
				}

				newLine := []string{"", "", "", string(scope)}
				data = append(data, newLine)
			}
		}
	}
	return data
}

func (g *globalRole) GetColumHeader() []string {
	return []string{
		"NAME",
		"AGE",
		"ACTION",
		"SCOPE",
	}
}
