// Copyright 2022 The Perses Authors
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
	cmdUtils "github.com/perses/perses/internal/cli/utils"
	v1 "github.com/perses/perses/pkg/client/api/v1"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

type datasource struct {
	Service
	apiClient v1.DatasourceInterface
}

func (d *datasource) CreateResource(entity modelAPI.Entity) (modelAPI.Entity, error) {
	return d.apiClient.Create(entity.(*modelV1.Datasource))
}

func (d *datasource) UpdateResource(entity modelAPI.Entity) (modelAPI.Entity, error) {
	return d.apiClient.Update(entity.(*modelV1.Datasource))
}

func (d *datasource) ListResource(prefix string) (interface{}, error) {
	return d.apiClient.List(prefix)
}

func (d *datasource) GetResource(name string) (modelAPI.Entity, error) {
	return d.apiClient.Get(name)
}

func (d *datasource) BuildMatrix(hits []modelAPI.Entity) [][]string {
	var data [][]string
	for _, hit := range hits {
		entity := hit.(*modelV1.Datasource)
		line := []string{
			entity.Metadata.Name,
			entity.Metadata.Project,
			string(entity.Spec.GetKind()),
			cmdUtils.FormatTime(entity.Metadata.UpdatedAt),
		}
		data = append(data, line)
	}
	return data
}

func (d *datasource) GetColumHeader() []string {
	return []string{
		"NAME",
		"PROJECT",
		"DATASOURCE_TYPE",
		"AGE",
	}
}
