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

package dependency

import (
	"context"
	"fmt"

	"github.com/perses/common/async"
	"github.com/perses/perses/internal/api/shared"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/resource"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type provisioning struct {
	async.SimpleTask
	serviceManager ServiceManager
	folders        []string
}

func (p *provisioning) Execute(_ context.Context, _ context.CancelFunc) error {
	if len(p.folders) == 0 {
		return nil
	}
	var entities []modelAPI.Entity
	for _, dir := range p.folders {
		objects, errors := file.UnmarshalEntitiesFromDirectory(dir)
		for _, err := range errors {
			logrus.WithError(err).Warningf("unable to load every entity from the folder %q", dir)
		}

		if len(objects) > 0 {
			entities = append(entities, objects...)
		}

	}
	p.applyEntity(entities)
	return nil
}

func (p *provisioning) String() string {
	return "provisioning service"
}

func (p *provisioning) applyEntity(entities []modelAPI.Entity) {
	for _, entity := range entities {
		kind := modelV1.Kind(entity.GetKind())
		name := entity.GetMetadata().GetName()
		project := resource.GetProject(entity.GetMetadata(), "")
		svc, svcErr := p.getService(kind)
		if svcErr != nil {
			logrus.WithError(svcErr).Errorf("unable to retrieve the service associated to %q", kind)
			continue
		}

		param := shared.Parameters{
			Name:    name,
			Project: project,
		}

		// retrieve if exists the entity from the Perses API
		_, apiError := svc.Get(param)
		if apiError != nil && !databaseModel.IsKeyNotFound(apiError) {
			logrus.WithError(apiError).Errorf("unable to retrieve the %q from the database", kind)
			continue
		}

		if databaseModel.IsKeyNotFound(apiError) {
			// the document doesn't exist, so we have to create it.
			if _, createError := svc.Create(entity); createError != nil {
				logrus.WithError(createError).Errorf("unable to create the %q %q", kind, name)
			}
		} else {
			// the document doesn't exist, so we have to create it.
			if _, updateError := svc.Update(entity, param); updateError != nil {
				logrus.WithError(updateError).Errorf("unable to update the %q %q", kind, name)
			}
		}
	}
}

func (p *provisioning) getService(kind modelV1.Kind) (shared.ToolboxService, error) {
	switch kind {
	case modelV1.KindDashboard:
		return p.serviceManager.GetDashboard(), nil
	case modelV1.KindDatasource:
		return p.serviceManager.GetDatasource(), nil
	case modelV1.KindFolder:
		return p.serviceManager.GetFolder(), nil
	case modelV1.KindGlobalDatasource:
		return p.serviceManager.GetGlobalDatasource(), nil
	case modelV1.KindGlobalSecret:
		return p.serviceManager.GetGlobalSecret(), nil
	case modelV1.KindGlobalVariable:
		return p.serviceManager.GetGlobalVariable(), nil
	case modelV1.KindProject:
		return p.serviceManager.GetProject(), nil
	case modelV1.KindSecret:
		return p.serviceManager.GetSecret(), nil
	case modelV1.KindUser:
		return p.serviceManager.GetUser(), nil
	case modelV1.KindVariable:
		return p.serviceManager.GetVariable(), nil
	default:
		return nil, fmt.Errorf("resource %q not supported by the provisioning service", kind)
	}
}
