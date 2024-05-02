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
	"errors"
	"fmt"

	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/client/perseshttp"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

func convertToEntityIfNoError[T modelAPI.Entity](entities []T, err error) ([]modelAPI.Entity, error) {
	if err != nil {
		return nil, err
	}
	var result []modelAPI.Entity
	for _, object := range entities {
		result = append(result, object)
	}
	return result, nil
}

func Upsert(svc Service, entity modelAPI.Entity) error {
	_, createErr := svc.CreateResource(entity)
	if createErr == nil {
		return nil
	}
	if !errors.Is(createErr, perseshttp.ConflictError) {
		return createErr
	}
	_, updateErr := svc.UpdateResource(entity)
	return updateErr
}

type Service interface {
	CreateResource(entity modelAPI.Entity) (modelAPI.Entity, error)
	UpdateResource(entity modelAPI.Entity) (modelAPI.Entity, error)
	ListResource(prefix string) ([]modelAPI.Entity, error)
	GetResource(name string) (modelAPI.Entity, error)
	DeleteResource(name string) error
	BuildMatrix(hits []modelAPI.Entity) [][]string
	GetColumHeader() []string
}

func New(kind modelV1.Kind, projectName string, apiClient api.ClientInterface) (Service, error) {
	switch kind {
	case modelV1.KindDashboard:
		return &dashboard{
			apiClient: apiClient.V1().Dashboard(projectName),
		}, nil
	case modelV1.KindDatasource:
		return &datasource{
			apiClient: apiClient.V1().Datasource(projectName),
		}, nil
	case modelV1.KindEphemeralDashboard:
		return &ephemeralDashboard{
			apiClient: apiClient.V1().EphemeralDashboard(projectName),
		}, nil
	case modelV1.KindFolder:
		return &folder{
			apiClient: apiClient.V1().Folder(projectName),
		}, nil
	case modelV1.KindGlobalDatasource:
		return &globalDatasource{
			apiClient: apiClient.V1().GlobalDatasource(),
		}, nil
	case modelV1.KindGlobalRole:
		return &globalRole{
			apiClient: apiClient.V1().GlobalRole(),
		}, nil
	case modelV1.KindGlobalRoleBinding:
		return &globalRoleBinding{
			apiClient: apiClient.V1().GlobalRoleBinding(),
		}, nil
	case modelV1.KindGlobalSecret:
		return &globalSecret{
			apiClient: apiClient.V1().GlobalSecret(),
		}, nil
	case modelV1.KindGlobalVariable:
		return &globalVariable{
			apiClient: apiClient.V1().GlobalVariable(),
		}, nil
	case modelV1.KindProject:
		return &project{
			apiClient: apiClient.V1().Project(),
		}, nil
	case modelV1.KindRole:
		return &role{
			apiClient: apiClient.V1().Role(projectName),
		}, nil
	case modelV1.KindRoleBinding:
		return &roleBinding{
			apiClient: apiClient.V1().RoleBinding(projectName),
		}, nil
	case modelV1.KindSecret:
		return &secret{
			apiClient: apiClient.V1().Secret(projectName),
		}, nil
	case modelV1.KindUser:
		return &user{
			apiClient: apiClient.V1().User(),
		}, nil
	case modelV1.KindVariable:
		return &variable{
			apiClient: apiClient.V1().Variable(projectName),
		}, nil
	default:
		return nil, fmt.Errorf("resource %q not supported by the command", kind)
	}
}
