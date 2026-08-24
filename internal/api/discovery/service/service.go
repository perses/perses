// Copyright The Perses Authors
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
	"strings"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

func containsDatasource(sources []string, name string) bool {
	for _, ds := range sources {
		if strings.EqualFold(ds, name) {
			return true
		}
	}
	return false
}

func New(caseSensitive bool, svc globaldatasource.Service, discoveryName string, discoveryType v1.DiscoveryType) *ApplyService {
	return &ApplyService{
		caseSensitive: caseSensitive,
		svc:           svc,
		discoveryName: discoveryName,
		discoveryType: discoveryType,
	}
}

type ApplyService struct {
	caseSensitive bool
	svc           globaldatasource.Service
	discoveryName string
	discoveryType v1.DiscoveryType
}

func (a *ApplyService) Apply(entities []*v1.GlobalDatasource) {
	if len(entities) == 0 {
		return
	}

	var currentNames []string
	for _, entity := range entities {
		entity.Metadata.Source = v1.DiscoverySource
		entity.Metadata.DiscoveryName = a.discoveryName
		entity.Metadata.DiscoveryType = a.discoveryType
		entity.GetMetadata().Flatten(a.caseSensitive)
		_, createErr := a.svc.Create(nil, entity)
		if createErr == nil {
			currentNames = append(currentNames, entity.Metadata.Name)
			continue
		}

		if !databaseModel.IsKeyConflict(createErr) {
			logrus.WithError(createErr).Errorf("unable to create the globaldatasource %q", entity.Metadata.Name)
			continue
		}

		param := apiInterface.Parameters{
			Name: entity.Metadata.Name,
		}

		if _, updateError := a.svc.Update(nil, entity, param); updateError != nil {
			logrus.WithError(updateError).Errorf("unable to update the globaldatasource %q", entity.Metadata.Name)
		}
		currentNames = append(currentNames, entity.Metadata.Name)
	}

	foundDatasources, err := a.svc.List(
		&globaldatasource.Query{
			Source:        v1.DiscoverySource,
			DiscoveryName: a.discoveryName,
		})
	if err != nil {
		logrus.WithError(err).Error("unable to get discovered globaldatasources")
		return
	}
	for _, ds := range foundDatasources {
		if !containsDatasource(currentNames, ds.Metadata.Name) {
			deleteParameters := apiInterface.Parameters{
				Name: ds.Metadata.Name,
			}
			err = a.svc.Delete(nil, deleteParameters)
			if err != nil {
				logrus.WithError(err).Errorf("unable to delete the globaldatasource %q", ds.Metadata.Name)
			}
		}
	}

}
