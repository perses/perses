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

package service

import (
	"time"

	"github.com/perses/perses/internal/cli/output"
	v1 "github.com/perses/perses/pkg/client/api/v1"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

type ephemeralDashboard struct {
	Service
	apiClient v1.EphemeralDashboardInterface
}

func (e *ephemeralDashboard) CreateResource(entity modelAPI.Entity) (modelAPI.Entity, error) {
	return e.apiClient.Create(entity.(*modelV1.EphemeralDashboard))
}

func (e *ephemeralDashboard) UpdateResource(entity modelAPI.Entity) (modelAPI.Entity, error) {
	return e.apiClient.Update(entity.(*modelV1.EphemeralDashboard))
}

func (e *ephemeralDashboard) ListResource(prefix string) ([]modelAPI.Entity, error) {
	return convertToEntityIfNoError(e.apiClient.List(prefix))
}

func (e *ephemeralDashboard) GetResource(name string) (modelAPI.Entity, error) {
	return e.apiClient.Get(name)
}

func (e *ephemeralDashboard) DeleteResource(name string) error {
	return e.apiClient.Delete(name)
}

func (e *ephemeralDashboard) BuildMatrix(hits []modelAPI.Entity) [][]string {
	var data [][]string
	for _, hit := range hits {
		entity := hit.(*modelV1.EphemeralDashboard)
		line := []string{
			entity.Metadata.Name,
			entity.Metadata.Project,
			output.FormatAge(entity.Metadata.UpdatedAt),
			output.FormatDuration(time.Until(entity.Metadata.UpdatedAt.Add(time.Duration(entity.Spec.TTL)))),
		}
		data = append(data, line)
	}
	return data
}

func (e *ephemeralDashboard) GetColumHeader() []string {
	return []string{
		"NAME",
		"PROJECT",
		"AGE",
		"REMAINING TTL",
	}
}
