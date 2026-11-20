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
	"fmt"

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
	// warnedCollisions tracks datasource names for which a one-time ownership
	// collision warning has already been logged, to avoid repeating it every cycle.
	warnedCollisions []string
}

func (a *ApplyService) Apply(ctx context.Context, entities []*v1.GlobalDatasource) error {
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
		_, createErr := a.svc.CreateForDiscovery(entity)
		if createErr == nil {
			continue
		}

		if !databaseModel.IsKeyConflict(createErr) {
			errs = append(errs, fmt.Errorf("globaldatasource %q: %w", entity.Metadata.Name, createErr))
			continue
		}

		param := apiInterface.Parameters{Name: entity.Metadata.Name}
		existing, getErr := a.svc.Get(param)
		if getErr != nil {
			errs = append(errs, fmt.Errorf("globaldatasource %q: %w", entity.Metadata.Name, getErr))
			continue
		}

		existingDiscovery := existing.Source.GetDiscovery()
		if existingDiscovery != nil {
			// Another discovery owns this datasource — skip, and warn once.
			if existingDiscovery.Name != a.discoverySource.Name {
				if !containsName(a.warnedCollisions, entity.Metadata.Name) {
					logrus.Warnf("globaldatasource %q is owned by discovery %q (%s); skipping", entity.Metadata.Name, existingDiscovery.Name, existingDiscovery.Type)
					a.warnedCollisions = append(a.warnedCollisions, entity.Metadata.Name)
				}
				continue
			}
		} else {
			// Nil source: datasource was created through the API, provisioned,
			// or discovered before the version that introduced this field.
			// Adopt it: stamp the source on first update so it is managed going forward.
			logrus.Infof("adopting globaldatasource %q: stamping discovery source %q (%s)", entity.Metadata.Name, a.discoverySource.Name, a.discoverySource.Type)
		}

		if _, updateError := a.svc.UpdateForDiscovery(entity, param); updateError != nil {
			errs = append(errs, fmt.Errorf("globaldatasource %q: %w", entity.Metadata.Name, updateError))
			continue
		}
	}

	return errors.Join(errs...)
}

func containsName(names []string, name string) bool {
	for _, n := range names {
		if n == name {
			return true
		}
	}
	return false
}
