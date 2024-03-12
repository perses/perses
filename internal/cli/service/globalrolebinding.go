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

type globalRoleBinding struct {
	Service
	apiClient v1.GlobalRoleBindingInterface
}

func (g *globalRoleBinding) CreateResource(entity modelAPI.Entity) (modelAPI.Entity, error) {
	return g.apiClient.Create(entity.(*modelV1.GlobalRoleBinding))
}

func (g *globalRoleBinding) UpdateResource(entity modelAPI.Entity) (modelAPI.Entity, error) {
	return g.apiClient.Update(entity.(*modelV1.GlobalRoleBinding))
}

func (g *globalRoleBinding) ListResource(prefix string) ([]modelAPI.Entity, error) {
	return convertToEntityIfNoError(g.apiClient.List(prefix))
}

func (g *globalRoleBinding) GetResource(name string) (modelAPI.Entity, error) {
	return g.apiClient.Get(name)
}

func (g *globalRoleBinding) DeleteResource(name string) error {
	return g.apiClient.Delete(name)
}

func (g *globalRoleBinding) BuildMatrix(hits []modelAPI.Entity) [][]string {
	var data [][]string
	for _, hit := range hits {
		entity := hit.(*modelV1.GlobalRoleBinding)
		line := []string{
			entity.Metadata.Name,
			output.FormatAge(entity.Metadata.UpdatedAt),
			entity.Spec.Role,
		}

		if len(entity.Spec.Subjects) == 0 {
			line = append(line, "EMPTY", "EMPTY")
			data = append(data, line)
			continue
		}

		firstLine := true
		for _, subject := range entity.Spec.Subjects {
			if firstLine {
				line = append(line, string(subject.Kind), subject.Name)
				data = append(data, line)
				firstLine = false
				continue
			}

			newLine := []string{"", "", "", string(subject.Kind), subject.Name}
			data = append(data, newLine)
		}
	}
	return data
}

func (g *globalRoleBinding) GetColumHeader() []string {
	return []string{
		"NAME",
		"AGE",
		"ROLE",
		"SUBJECT KIND",
		"SUBJECT NAME",
	}
}
