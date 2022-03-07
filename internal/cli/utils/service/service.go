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
	"encoding/json"
	"fmt"

	"github.com/perses/perses/pkg/client/api"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"gopkg.in/yaml.v2"
)

func unmarshalEntity(isJSON bool, data []byte, entity modelAPI.Entity) error {
	var unmarshalErr error
	if isJSON {
		unmarshalErr = json.Unmarshal(data, entity)
	} else {
		unmarshalErr = yaml.Unmarshal(data, entity)
	}
	return unmarshalErr
}

type Service interface {
	CreateResource(entity modelAPI.Entity) (modelAPI.Entity, error)
	UpdateResource(entity modelAPI.Entity) (modelAPI.Entity, error)
	ListResource(prefix string) (interface{}, error)
	GetResource(name string) (modelAPI.Entity, error)
	BuildMatrix(hits []modelAPI.Entity) [][]string
	GetColumHeader() []string
	Unmarshal(isJSON bool, data []byte) (modelAPI.Entity, error)
}

func NewService(kind modelV1.Kind, projectName string, apiClient api.ClientInterface) (Service, error) {
	switch kind {
	case modelV1.KindDashboard:
		return &dashboard{
			apiClient: apiClient.V1().Dashboard(projectName),
		}, nil
	case modelV1.KindDatasource:
		return &datasource{
			apiClient: apiClient.V1().Datasource(projectName),
		}, nil
	case modelV1.KindFolder:
		return &folder{
			apiClient: apiClient.V1().Folder(projectName),
		}, nil
	case modelV1.KindGlobalDatasource:
		return &globalDatasource{
			apiClient: apiClient.V1().GlobalDatasource(),
		}, nil
	case modelV1.KindProject:
		return &project{
			apiClient: apiClient.V1().Project(),
		}, nil
	default:
		return nil, fmt.Errorf("resource %q not supported by the command", kind)
	}
}
