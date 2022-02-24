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
	"fmt"

	"github.com/perses/perses/pkg/client/api"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

type Service interface {
	ListResource(prefix string) (interface{}, error)
	GetResource(name string) (modelAPI.Entity, error)
	BuildMatrix(hits []modelAPI.Entity) [][]string
	GetColumHeader() []string
}

func NewService(kind modelV1.Kind, projectName string, apiClient api.ClientInterface) (Service, error) {
	switch kind {
	case modelV1.KindDashboard:
		return &dashboard{
			project:   projectName,
			apiClient: apiClient,
		}, nil
	case modelV1.KindDatasource:
		return &datasource{
			project:   projectName,
			apiClient: apiClient,
		}, nil
	case modelV1.KindFolder:
		return &folder{
			project:   projectName,
			apiClient: apiClient,
		}, nil
	case modelV1.KindGlobalDatasource:
		return &globalDatasource{
			apiClient: apiClient,
		}, nil
	case modelV1.KindProject:
		return &project{
			apiClient: apiClient,
		}, nil
	default:
		return nil, fmt.Errorf("resource %q not supported by get command", kind)
	}
}
