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

type globalVariable struct {
	Service
	apiClient v1.GlobalVariableInterface
}

func (d *globalVariable) CreateResource(entity modelAPI.Entity) (modelAPI.Entity, error) {
	return d.apiClient.Create(entity.(*modelV1.GlobalVariable))
}

func (d *globalVariable) UpdateResource(entity modelAPI.Entity) (modelAPI.Entity, error) {
	return d.apiClient.Update(entity.(*modelV1.GlobalVariable))
}

func (d *globalVariable) ListResource(prefix string) ([]modelAPI.Entity, error) {
	return convertToEntityIfNoError(d.apiClient.List(prefix))
}

func (d *globalVariable) GetResource(name string) (modelAPI.Entity, error) {
	return d.apiClient.Get(name)
}

func (d *globalVariable) DeleteResource(name string) error {
	return d.apiClient.Delete(name)
}

func (d *globalVariable) BuildMatrix(hits []modelAPI.Entity) [][]string {
	var data [][]string
	for _, hit := range hits {
		entity := hit.(*modelV1.GlobalVariable)
		line := []string{
			entity.Metadata.Name,
			string(entity.Spec.Kind),
			output.FormatTime(entity.Metadata.UpdatedAt),
		}
		data = append(data, line)
	}
	return data
}

func (d *globalVariable) GetColumHeader() []string {
	return []string{
		"NAME",
		"VARIABLE_TYPE",
		"AGE",
	}
}
