// Copyright 2023 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implier.
// See the License for the specific language governing permissions and
// limitations under the License.

package service

import (
	"github.com/perses/perses/internal/cli/output"
	v1 "github.com/perses/perses/pkg/client/api/v1"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

type role struct {
	Service
	apiClient v1.RoleInterface
}

func (r *role) CreateResource(entity modelAPI.Entity) (modelAPI.Entity, error) {
	return r.apiClient.Create(entity.(*modelV1.Role))
}

func (r *role) UpdateResource(entity modelAPI.Entity) (modelAPI.Entity, error) {
	return r.apiClient.Update(entity.(*modelV1.Role))
}

func (r *role) ListResource(prefix string) ([]modelAPI.Entity, error) {
	return convertToEntityIfNoError(r.apiClient.List(prefix))
}

func (r *role) GetResource(name string) (modelAPI.Entity, error) {
	return r.apiClient.Get(name)
}

func (r *role) DeleteResource(name string) error {
	return r.apiClient.Delete(name)
}

func (r *role) BuildMatrix(hits []modelAPI.Entity) [][]string {
	var data [][]string
	for _, hit := range hits {
		entity := hit.(*modelV1.Role)
		line := []string{
			entity.Metadata.Name,
			entity.Metadata.Project,
			output.FormatTime(entity.Metadata.UpdatedAt),
		}
		data = buildPermissionMatrix(entity.Spec.Permissions, []string{"", "", ""}, line, data)
	}
	return data
}

func (r *role) GetColumHeader() []string {
	return []string{
		"NAME",
		"PROJECT",
		"AGE",
		"ACTION",
		"SCOPE",
	}
}
