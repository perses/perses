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
	"context"
	"errors"
	"strings"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

func New(caseSensitive bool, svc globaldatasource.Service, discoverySource v1.DiscoverySource) *ApplyService {
	return &ApplyService{
		caseSensitive:   caseSensitive,
		svc:             svc,
		discoverySource: discoverySource,
	}
}

type ApplyService struct {
	caseSensitive   bool
	svc             globaldatasource.Service
	discoverySource v1.DiscoverySource
}

func (a *ApplyService) Apply(ctx context.Context, entities []*v1.GlobalDatasource) error {
	if len(entities) == 0 {
		return nil
	}

	var currentNames []string
	var errs []error
	for _, entity := range entities {
		if err := ctx.Err(); err != nil {
			return err
		}
		entity.Source = &v1.Source{
			Discovery: &v1.DiscoverySource{
				Name: a.discoverySource.Name,
				Type: a.discoverySource.Type,
			},
		}
		entity.GetMetadata().Flatten(a.caseSensitive)
		_, createErr := a.svc.Create(nil, entity)
		if createErr == nil {
			currentNames = append(currentNames, entity.Metadata.Name)
			continue
		}

		if !databaseModel.IsKeyConflict(createErr) {
			errs = append(errs, createErr)
			continue
		}

		param := apiInterface.Parameters{Name: entity.Metadata.Name}
		existing, getErr := a.svc.Get(param)
		if getErr != nil {
			errs = append(errs, getErr)
			continue
		}

		existingDiscovery := existing.Source.GetDiscovery()
		if existingDiscovery != nil {
			// Another discovery owns this datasource — skip.
			if existingDiscovery.Name != a.discoverySource.Name || existingDiscovery.Type != a.discoverySource.Type {
				errs = append(errs, errors.New("skipping update of globaldatasource "+entity.Metadata.Name+": owned by a different discovery"))
				continue
			}
		} else {
			// Nil source: datasource predates discovery (created manually, provisioned, or
			// created before this feature was introduced). Adopt it: stamp the source on first
			// update so it is managed going forward.
			logrus.Infof("adopting globaldatasource %q: stamping discovery source %q (%s)", entity.Metadata.Name, a.discoverySource.Name, a.discoverySource.Type)
		}

		if _, updateError := a.svc.Update(nil, entity, param); updateError != nil {
			errs = append(errs, updateError)
			continue
		}
		currentNames = append(currentNames, entity.Metadata.Name)
	}

	foundDatasources, err := a.svc.List(
		&globaldatasource.Query{
			DiscoveryName: a.discoverySource.Name,
			DiscoveryType: a.discoverySource.Type,
		})
	if err != nil {
		logrus.WithError(err).Error("unable to get discovered globaldatasources")
		return errors.Join(append(errs, err)...)
	}
	for _, ds := range foundDatasources {
		if err := ctx.Err(); err != nil {
			return errors.Join(append(errs, err)...)
		}
		if !containsDatasource(currentNames, ds.Metadata.Name) {
			deleteParameters := apiInterface.Parameters{Name: ds.Metadata.Name}
			if deleteErr := a.svc.Delete(nil, deleteParameters); deleteErr != nil {
				errs = append(errs, deleteErr)
			}
		}
	}

	return errors.Join(errs...)
}

func containsDatasource(sources []string, name string) bool {
	for _, ds := range sources {
		if strings.EqualFold(ds, name) {
			return true
		}
	}
	return false
}
