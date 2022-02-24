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
	"github.com/perses/perses/pkg/client/api"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

type dashboard struct {
	Service
	project   string
	apiClient api.ClientInterface
}

func (d *dashboard) ListResource(prefix string) (interface{}, error) {
	return d.apiClient.V1().Dashboard(d.project).List(prefix)
}

func (d *dashboard) GetResource(name string) (modelAPI.Entity, error) {
	return d.apiClient.V1().Dashboard(d.project).Get(name)
}

func (d *dashboard) BuildMatrix(hits []modelAPI.Entity) [][]string {
	var data [][]string
	for _, hit := range hits {
		entity := hit.(*modelV1.Dashboard)
		line := []string{
			entity.Metadata.Name,
			entity.Metadata.Project,
			cmdUtils.FormatTime(entity.Metadata.UpdatedAt),
		}
		data = append(data, line)
	}
	return data
}

func (d *dashboard) GetColumHeader() []string {
	return []string{
		"NAME",
		"PROJECT",
		"AGE",
	}
}
